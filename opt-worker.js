// Worker de l'optimisation d'équipement : joue des paquets de combats (voir opt-job.js).
import { runJob } from './opt-job.js';
self.onmessage = ({ data: { id, job } }) => {
  try { self.postMessage({ id, out: runJob(job) }); }
  catch (e) { self.postMessage({ id, error: String((e && e.stack) || e) }); }
};
