import { Parser } from 'json2csv';
import archiver from 'archiver';
import { PassThrough } from 'stream';

/**
 * Generates Development Tasks CSV.
 */
export const generateDevCSV = (devTasks) => {
  const rows = [];
  devTasks.forEach((task) => {
    if (task.subtasks && task.subtasks.length > 0) {
      task.subtasks.forEach((sub, idx) => {
        rows.push({
          task_id: task.task_id,
          milestone: task.milestone,
          module: task.module,
          task_name: task.task_name,
          description: idx === 0 ? task.description : '',
          assignee_role: idx === 0 ? task.assignee_role : '',
          assignee_name: idx === 0 ? task.assignee_name : '',
          estimated_hours: idx === 0 ? task.estimated_hours : '',
          start_date: idx === 0 ? task.start_date : '',
          due_date: idx === 0 ? task.due_date : '',
          priority: idx === 0 ? task.priority : '',
          dependencies: idx === 0 ? (task.dependencies || []).join('|') : '',
          status: idx === 0 ? task.status : '',
          subtask_id: sub.subtask_id,
          subtask_name: sub.subtask_name,
          subtask_hours: sub.estimated_hours,
          subtask_assignee: sub.assignee_name,
        });
      });
    } else {
      rows.push({
        task_id: task.task_id,
        milestone: task.milestone,
        module: task.module,
        task_name: task.task_name,
        description: task.description,
        assignee_role: task.assignee_role,
        assignee_name: task.assignee_name,
        estimated_hours: task.estimated_hours,
        start_date: task.start_date,
        due_date: task.due_date,
        priority: task.priority,
        dependencies: (task.dependencies || []).join('|'),
        status: task.status,
        subtask_id: '',
        subtask_name: '',
        subtask_hours: '',
        subtask_assignee: '',
      });
    }
  });

  const parser = new Parser();
  return parser.parse(rows);
};

/**
 * Generates QA Tasks CSV.
 */
export const generateQACSV = (qaTasks) => {
  const parser = new Parser();
  return parser.parse(qaTasks);
};

/**
 * Generates Deployment Tasks CSV.
 */
export const generateDeploymentCSV = (deploymentTasks) => {
  const parser = new Parser();
  return parser.parse(deploymentTasks);
};

/**
 * Zips multiple CSV files into one.
 */
export const zipAllCSVs = async (devCsv, qaCsv, deploymentCsv) => {
  const archive = archiver('zip', { zlib: { level: 9 } });
  const passthrough = new PassThrough();
  const chunks = [];

  passthrough.on('data', (chunk) => chunks.push(chunk));

  return new Promise((resolve, reject) => {
    passthrough.on('end', () => resolve(Buffer.concat(chunks)));
    passthrough.on('error', (err) => reject(err));

    archive.pipe(passthrough);
    archive.append(devCsv, { name: 'dev_tasks.csv' });
    archive.append(qaCsv, { name: 'qa_tasks.csv' });
    archive.append(deploymentCsv, { name: 'deployment_tasks.csv' });
    archive.finalize();
  });
};
