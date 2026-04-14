import * as aiService from './services/aiService.js';
import * as sowService from './services/sowService.js';
import * as csvService from './services/csvService.js';
import * as storageService from './services/storageService.js';
import { supabaseAdmin as supabase } from '../../config/supabase.js';
import { StatusCodes } from 'http-status-codes';
import asyncHandler from 'express-async-handler';

/**
 * Generate project documentation using AI.
 */
export const generate = asyncHandler(async (req, res) => {
  const { formData } = req.body;
  const userId = req.user?.id;

  // 1. Call AI Service
  const aiResult = await aiService.generateProjectData(formData);

  // 2. Save to Database (Draft)
  const { data: project, error } = await supabase
    .from('sow_projects')
    .insert([{
      project_name: formData.project_name,
      client_name: formData.client_name,
      client_email: formData.client_email,
      created_by: userId,
      form_data: formData,
      sow_data: aiResult.data.sow,
      dev_tasks: aiResult.data.dev_tasks,
      qa_tasks: aiResult.data.qa_tasks,
      deployment_tasks: aiResult.data.deployment_tasks,
      status: 'draft'
    }])
    .select()
    .single();

  if (error) throw error;

  // 3. Log Generation
  await supabase.from('sow_generation_log').insert([{
    project_id: project.id,
    model: aiResult.model,
    input_tokens: aiResult.usage.input_tokens,
    output_tokens: aiResult.usage.output_tokens,
    success: true
  }]);

  res.status(StatusCodes.CREATED).json({
    success: true,
    data: project
  });
});

/**
 * Finalize SoW and generate all files.
 */
export const finalize = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // 1. Fetch Project Data
  const { data: project, error: fetchError } = await supabase
    .from('sow_projects')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !project) {
    return res.status(StatusCodes.NOT_FOUND).json({ success: false, message: 'Project not found' });
  }

  // 2. Generate Files
  const pdfBuffer = await sowService.generatePDF(project);
  const docxBuffer = await sowService.generateDOCX(project);
  
  const devCsv = csvService.generateDevCSV(project.dev_tasks);
  const qaCsv = csvService.generateQACSV(project.qa_tasks);
  const depCsv = csvService.generateDeploymentCSV(project.deployment_tasks);

  // 3. Upload to Cloudinary
  const pdfUrl = await storageService.uploadBuffer(pdfBuffer, 'sow/pdfs', `sow_${id}`, 'raw');
  const docxUrl = await storageService.uploadBuffer(docxBuffer, 'sow/docs', `sow_${id}`, 'raw');
  
  const devCsvUrl = await storageService.uploadBuffer(Buffer.from(devCsv), 'sow/csv', `dev_tasks_${id}`, 'raw');
  const qaCsvUrl = await storageService.uploadBuffer(Buffer.from(qaCsv), 'sow/csv', `qa_tasks_${id}`, 'raw');
  const depCsvUrl = await storageService.uploadBuffer(Buffer.from(depCsv), 'sow/csv', `dep_tasks_${id}`, 'raw');

  // 4. Update Database
  const { data: updatedProject, error: updateError } = await supabase
    .from('sow_projects')
    .update({
      pdf_url: pdfUrl,
      docx_url: docxUrl,
      dev_csv_url: devCsvUrl,
      qa_csv_url: qaCsvUrl,
      deployment_csv_url: depCsvUrl,
      status: 'finalized'
    })
    .eq('id', id)
    .select()
    .single();

  if (updateError) throw updateError;

  res.status(StatusCodes.OK).json({
    success: true,
    data: updatedProject
  });
});

/**
 * List all projects.
 */
export const list = asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('sow_projects')
    .select('*, created_by_profile:profiles(full_name)')
    .order('created_at', { ascending: false });

  if (error) throw error;

  res.status(StatusCodes.OK).json({
    success: true,
    data
  });
});

/**
 * Get project by ID.
 */
export const getById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('sow_projects')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;

  res.status(StatusCodes.OK).json({
    success: true,
    data
  });
});

/**
 * Update project data (manual edits).
 */
export const update = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  const { data, error } = await supabase
    .from('sow_projects')
    .update(updateData)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  res.status(StatusCodes.OK).json({
    success: true,
    data
  });
});

/**
 * Delete project.
 */
export const remove = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('sow_projects')
    .delete()
    .eq('id', id);

  if (error) throw error;

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Project deleted successfully'
  });
});
