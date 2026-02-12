const pool = require("../config/db");

const addEvaluation = async (id, idUser, data) => {
  const { medication, medication_detail, uncomfortable_pain, note_session, therapist, theraphy, duration, date } = data;
  const query = "INSERT INTO evaluations (customer_id,  therapist_id,therapy_type,  date, enteredby, entereddate, active) VALUES (?,?,?,?,?,?,?)";
  const [result] = await pool.query(query, [id, therapist, theraphy, date, idUser, new Date(), true]);
  return result.insertId;
};

const addEvalanotate = async (id, idUser, evaluatioId, data, imageid) => {
  const { x, y, ket } = data;
  const query = "INSERT INTO evalannotate (evaluationid,x_percent, y_percent, bodyimageid, bodyimagenotes, enteredby, entereddate) VALUES (?,?,?,?,?,?,?)";
  await pool.query(query, [evaluatioId, x, y, imageid, ket, idUser, new Date()]);
};

const addSessionNotes = async (id, idUser, evaluatioId, data) => {
  const { duration, medication, medication_detail, uncomfortable_pain, therapist, note_session } = data;
  const query = `INSERT INTO 
  session_notes (customer_id,therapists_id, evaluation_id, duration_minutes, on_medication, medication_details, therapist_note, enteredby, entereddate) 
  VALUES (?,?,?,?,?,?,?,?,?) `;
  await pool.query(query, [id, therapist, evaluatioId, duration, medication, medication_detail, note_session, idUser, new Date()]);
};

const getEvaluation = async (id) => {
  const query = `SELECT 
  evaluations.entereddate AS evaluation_entereddate,
   evaluations.enteredby AS evaluation_enteredby,
  session_notes.*,
  evaluations.*,
  evalannotate.*,
  evaluation_pain_areas.*
  FROM session_notes 
  JOIN evaluations ON session_notes.evaluation_id = evaluations.evaluationid 
  LEFT JOIN evalannotate ON evaluations.evaluationid = evalannotate.evaluationid 
  LEFT JOIN evaluation_pain_areas ON evaluations.evaluationid = evaluation_pain_areas.evaluation_id  
  WHERE evaluations.customer_id = ? 
  ORDER BY evaluations.entereddate DESC`;
  const [rows] = await pool.query(query, [id]);

  const therapistEvaluation = {};

  rows.forEach((item, index) => {
    if (!therapistEvaluation[item.evaluation_id]) {
      therapistEvaluation[item.evaluation_id] = {
        session_notesid: item.session_notesid,
        customer_id: item.customer_id,
        evaluation_id: item.evaluation_id,
        duration: item.duration_minutes,
        therapist_note: item.therapist_note,
        therapy_type: item.therapy_type,
        pain_area: item.pain_area,
        date: item.date,
        duration: item.duration_minutes,
        anotate: [],
        enteredby: item.enteredby,
        entereddate: item.evaluation_entereddate,
        editeddate: item.editeddate,
        medication: item.on_medication,
        medication_detail: item.medication_details,
      };
    }

    therapistEvaluation[item.evaluation_id].anotate.push({
      x_percent: item.x_percent,
      y_percent: item.y_percent,
      bodyimagenotes: item.bodyimagenotes,
      bodyimageid: item.bodyimageid,
      evalannotateid: item.evalannotateid,
    });
  });

  const result = Object.values(therapistEvaluation).sort((a, b) => new Date(b.entereddate) - new Date(a.entereddate));

  return result;
};

const updateDataEvaluation = async (id, idUser, data) => {
  const { therapist, theraphy } = data;
  const [result] = await pool.query(
    `UPDATE evaluations SET 
      therapist_id = ?, 
      therapy_type = ?, 
      editedby = ?, 
      editeddate = ?
     WHERE evaluationid = ?`,
    [therapist, theraphy, idUser, new Date(), id]
  );

  return result;
};

const updateDataEvalanotate = async (id, idUser, data, imageid, enteredby, entereddate) => {
  const { x, y, ket } = data;
  // const sqlDate = entereddate.toISOString().slice(0, 19).replace("T", " ");

  const query = "INSERT INTO evalannotate (evaluationid,x_percent, y_percent, bodyimageid, bodyimagenotes, enteredby, entereddate, editedby, editeddate) VALUES (?,?,?,?,?,?,?,?,?)";
  const [result] = await pool.query(query, [id, x, y, imageid, ket, enteredby, entereddate, idUser, new Date()]);

  return result;
};

const updateDataSessionNotes = async (id, idUser, data) => {
  const { duration, medication, medication_detail, note_session } = data;
  const [result] = await pool.query(
    `UPDATE session_notes SET
      duration_minutes = ?,
      on_medication = ?,
      medication_details = ?,
      therapist_note = ?,
      editedby=?,
      editeddate=?
     WHERE evaluation_id = ?`,
    [duration, medication, medication_detail, note_session, idUser, new Date(), id]
  );

  const [rows] = await pool.query(`SELECT entereddate FROM session_notes WHERE evaluation_id = ?`, [id]);

  return rows[0]?.entereddate ?? null;
};

const addDataEvaluationPainArea = async (evaluationId, data) => {
  const { uncomfortable_pain } = data;
  const query = "INSERT INTO evaluation_pain_areas (evaluation_id, pain_area) VALUES (?,?)";
  await pool.query(query, [evaluationId, uncomfortable_pain]);
};

const updateDataEvaluationPainArea = async (id, data) => {
  const { uncomfortable_pain } = data;
  const query = `UPDATE evaluation_pain_areas SET
      pain_area = ?
     WHERE evaluation_id = ?`;
  await pool.query(query, [uncomfortable_pain, id]);
};

const deleteEvaluation = async (id) => {
  const query = "DELETE FROM evaluations WHERE id = ?";
  const [result] = await pool.query(query, [id]);
  return result;
};

const deleteEvalannotate = async (id) => {
  const query = "DELETE FROM evalannotate WHERE evaluationid = ?";
  const [result] = await pool.query(query, [id]);
  return result;
};
const deleteEvaluationPainAreas = async (id) => {
  const query = "DELETE FROM evaluation_pain_areas WHERE evaluation_id = ?";
  const [result] = await pool.query(query, [id]);
  return result;
};
const deleteSessionNote = async (id) => {
  const query = "DELETE FROM session_notes WHERE evaluation_id = ?";
  const [result] = await pool.query(query, [id]);
  return result;
};

module.exports = { addEvaluation, addEvalanotate, addSessionNotes, getEvaluation, updateDataEvaluation, updateDataEvalanotate, updateDataSessionNotes, addDataEvaluationPainArea, updateDataEvaluationPainArea, deleteEvaluation, deleteEvalannotate, deleteEvaluationPainAreas, deleteSessionNote };
