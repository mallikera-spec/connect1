import api from '../../lib/api';

export const PollsService = {
    getActivePolls: () => api.get('/polls'),
    vote: (pollId, optionId) => api.post('/polls/vote', { pollId, optionId }),
    createPoll: (payload) => api.post('/polls', payload),
    getPollResults: (pollId) => api.get(`/polls/${pollId}/results`),
    closePoll: (pollId) => api.patch(`/polls/${pollId}/close`)
};
