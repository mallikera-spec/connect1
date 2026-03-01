import { supabaseAdmin } from '../../config/supabase.js';

export const createPoll = async (userId, payload) => {
    const { question, options, expires_at } = payload;

    // 1. Create the poll
    const { data: poll, error: pollError } = await supabaseAdmin
        .from('polls')
        .insert({
            question,
            created_by: userId,
            expires_at: expires_at || null,
            status: 'Active'
        })
        .select()
        .single();

    if (pollError) throw pollError;

    // 2. Create the options
    const optionsToInsert = options.map(opt => ({
        poll_id: poll.id,
        text: opt
    }));

    const { error: optionsError } = await supabaseAdmin
        .from('poll_options')
        .insert(optionsToInsert);

    if (optionsError) throw optionsError;

    return { ...poll, options: optionsToInsert };
};

export const getActivePolls = async (userId) => {
    // Fetch polls that are active and haven't expired
    const now = new Date().toISOString();
    const { data: polls, error } = await supabaseAdmin
        .from('polls')
        .select(`
            *,
            options:poll_options(*),
            votes:poll_votes(option_id)
        `)
        .eq('status', 'Active')
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order('created_at', { ascending: false });

    if (error) throw error;

    // Check if the user has already voted
    const processedPolls = polls.map(poll => {
        const userVote = poll.votes.find(v => v.user_id === userId); // Wait, need to select user_id too
        return {
            ...poll,
            hasVoted: !!userVote,
            myVote: userVote?.option_id || null
        };
    });

    return processedPolls;
};

// Re-fetching with user_id for vote check
export const getPollsForUser = async (userId) => {
    const now = new Date().toISOString();
    const { data: polls, error } = await supabaseAdmin
        .from('polls')
        .select(`
            *,
            options:poll_options(*),
            user_vote:poll_votes!poll_votes_poll_id_fkey(option_id, user_id)
        `)
        .eq('status', 'Active')
        .or(`expires_at.is.null,expires_at.gt.${now}`)
        .order('created_at', { ascending: false });

    if (error) throw error;

    return polls.map(p => {
        const myVoteRecord = p.user_vote?.find(v => v.user_id === userId);
        const { user_vote, ...rest } = p;
        return {
            ...rest,
            hasVoted: !!myVoteRecord,
            myVote: myVoteRecord?.option_id || null
        };
    });
};

export const vote = async (userId, pollId, optionId) => {
    // 1. Check if poll is still active
    const { data: poll } = await supabaseAdmin
        .from('polls')
        .select('status, expires_at')
        .eq('id', pollId)
        .single();

    if (!poll || poll.status !== 'Active') throw new Error('Poll is no longer active');
    if (poll.expires_at && new Date(poll.expires_at) < new Date()) throw new Error('Poll has expired');

    // 2. Check for existing vote
    const { data: existingVote } = await supabaseAdmin
        .from('poll_votes')
        .select('id')
        .eq('poll_id', pollId)
        .eq('user_id', userId)
        .single();

    if (existingVote) throw new Error('You have already voted in this poll');

    // 3. Record vote
    const { data, error } = await supabaseAdmin
        .from('poll_votes')
        .insert({ poll_id: pollId, option_id: optionId, user_id: userId })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getPollResults = async (pollId) => {
    const { data: poll, error: pollError } = await supabaseAdmin
        .from('polls')
        .select(`
            *,
            options:poll_options(*)
        `)
        .eq('id', pollId)
        .single();

    if (pollError) throw pollError;

    const { data: votes, error: voteError } = await supabaseAdmin
        .from('poll_votes')
        .select(`
            option_id,
            user:profiles!poll_votes_user_id_fkey(full_name)
        `)
        .eq('poll_id', pollId);

    if (voteError) throw voteError;

    // Count votes per option and collect voter names
    const results = poll.options.map(opt => {
        const optionVotes = votes.filter(v => v.option_id === opt.id);
        return {
            ...opt,
            count: optionVotes.length,
            voters: optionVotes.map(v => v.user?.full_name).filter(Boolean)
        };
    });

    return { ...poll, options: results, totalVotes: votes.length };
};

export const closePoll = async (pollId, userId) => {
    const { data, error } = await supabaseAdmin
        .from('polls')
        .update({ status: 'Closed' })
        .eq('id', pollId)
        .select()
        .single();

    if (error) throw error;
    return data;
};
