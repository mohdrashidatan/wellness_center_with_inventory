const evaluation = require("../models/evaluationModel");

const addNewEvaluation = async (id, idUser, data) => {
  try {
    const result = evaluation.addEvaluation(id, idUser, data);
    return result;
  } catch (error) {
    console.error("Service error:", error);
    throw new Error("Failed add evaluation");
  }
};
const addNewEvalanotate = async (id, idUser, evaluationId, data) => {
  try {
    const { front, back } = data;
    console.log(data);
    let result;
    front.forEach((item) => {
      result = evaluation.addEvalanotate(id, idUser, evaluationId, item, "1");
    });
    back.forEach((item) => {
      result = evaluation.addEvalanotate(id, idUser, evaluationId, item, "0");
    });
    return result;
  } catch (error) {
    console.error("Service error:", error);
    throw new Error("Failed add evaluation");
  }
};

const addNewSessionNotes = async (id, idUser, evaluationId, data) => {
  try {
    const result = evaluation.addSessionNotes(id, idUser, evaluationId, data);
    return result;
  } catch (error) {
    console.error("Service error:", error);
    throw new Error("Failed add evaluation");
  }
};

const getEvaluationData = async (id) => {
  try {
    const result = evaluation.getEvaluation(id);

    return result;
  } catch (error) {
    console.error("Service error:", error);
    throw new Error("Failed add evaluation");
  }
};

const updateEvaluation = async (id, idUser, data) => {
  try {
    const result = evaluation.updateDataEvaluation(id, idUser, data);
    return result;
  } catch (error) {
    console.error("Service error:", error);
    throw new Error("Failed update evaluation");
  }
};

const updateEvalanotate = async (id, idUser, data, entereddate) => {
  try {
    const { front, back, enteredby } = data;

    let result;
    front.forEach((item) => {
      result = evaluation.updateDataEvalanotate(id, idUser, item, "1", enteredby, entereddate);
    });
    back.forEach((item) => {
      result = evaluation.updateDataEvalanotate(id, idUser, item, "0", enteredby, entereddate);
    });
    return result;
  } catch (error) {
    console.error("Service error:", error);
    throw new Error("Failed update evalanotate");
  }
};

const updateSessionNotes = async (id, idUser, data) => {
  try {
    const result = evaluation.updateDataSessionNotes(id, idUser, data);
    return result;
  } catch (error) {
    console.error("Service error:", error);
    throw new Error("Failed update evalanotate");
  }
};

const addEvaluationPainArea = async (evaluationId, data) => {
  try {
    const result = evaluation.addDataEvaluationPainArea(evaluationId, data);
    return result;
  } catch (error) {
    console.error("Service error:", error);
    throw new Error("Failed update evalanotate");
  }
};

const updateEvaluationPainArea = async (id, data) => {
  try {
    const result = evaluation.updateDataEvaluationPainArea(id, data);
    return result;
  } catch (error) {
    console.error("Service error:", error);
    throw new Error("Failed update evalanotate");
  }
};

const deleteDataEvaluation = async (id) => {
  try {
    const result = evaluation.deleteEvaluation(id);
    return result;
  } catch (error) {
    console.error("Service error:", error);
    throw new Error("Failed update evalanotate");
  }
};

const deleteDataEvalanotate = async (id) => {
  try {
    const result = evaluation.deleteEvalannotate(id);
    return result;
  } catch (error) {
    console.error("Service error:", error);
    throw new Error("Failed update evalanotate");
  }
};

const deleteDataPainAreas = async (id) => {
  try {
    const result = evaluation.deleteEvaluationPainAreas(id);
    return result;
  } catch (error) {
    console.error("Service error:", error);
    throw new Error("Failed update evalanotate");
  }
};

const deleteDataSession = async (id) => {
  try {
    const result = evaluation.deleteSessionNote(id);
    return result;
  } catch (error) {
    console.error("Service error:", error);
    throw new Error("Failed update evalanotate");
  }
};

module.exports = { addNewEvaluation, addNewEvalanotate, addNewSessionNotes, getEvaluationData, updateEvaluation, updateEvalanotate, updateSessionNotes, addEvaluationPainArea, updateEvaluationPainArea, deleteDataEvaluation, deleteDataEvalanotate, deleteDataPainAreas, deleteDataSession };
