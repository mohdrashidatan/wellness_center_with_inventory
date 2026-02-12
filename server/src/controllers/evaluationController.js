const evaluationService = require("../services/evaluationService");

const addEvaluation = async (req, res) => {
  try {
    const id = req.params.id;
    const idUser = req.user.userId;
    const evaluationId = await evaluationService.addNewEvaluation(id, idUser, req.body);
    await evaluationService.addNewEvalanotate(id, idUser, evaluationId, req.body);
    await evaluationService.addNewSessionNotes(id, idUser, evaluationId, req.body);
    await evaluationService.addEvaluationPainArea(evaluationId, req.body);
    res.status(200).json({
      success: true,
      message: "Registration successful",
    });
  } catch (error) {
    console.error("Add Evaluation:", error);

    res.status(500).json({
      success: false,
      message: "Evaluation Error",
      error: error.message,
    });
  }
};

const editEvaluation = async (req, res) => {
  try {
    console.log("entered by : " + req.body.enteredby);

    const id = req.params.id;
    const idUser = req.user.userId;
    const evaluationId = await evaluationService.updateEvaluation(id, idUser, req.body);

    await evaluationService.deleteDataEvalanotate(id);
    const entereddate = await evaluationService.updateSessionNotes(id, idUser, req.body);

    await evaluationService.updateEvalanotate(id, idUser, req.body, entereddate);
    await evaluationService.updateEvaluationPainArea(id, req.body);
    res.status(200).json({
      success: true,
      message: "Registration successful",
    });
  } catch (error) {
    console.error("Add Evaluation:", error);

    res.status(500).json({
      success: false,
      message: "Evaluation Error",
      error: error.message,
    });
  }
};

const getEvaluation = async (req, res) => {
  try {
    const id = req.params.id;
    const result = await evaluationService.getEvaluationData(id);

    res.status(200).json({
      success: true,
      message: "Registration successful",
      data: result,
    });
  } catch (error) {
    console.error("Error Get Data:", error);

    res.status(500).json({
      success: false,
      message: "Evaluation Error",
      error: error.message,
    });
  }
};

const deleteEvaluation = async (req, res) => {
  const id = req.params.id;
  try {
    await evaluationService.deleteDataEvalanotate(id);
    await evaluationService.deleteDataPainAreas(id);
    await evaluationService.deleteDataSession(id);
    const result = await evaluationService.deleteDataEvaluation(id);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error Delete data:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { addEvaluation, getEvaluation, editEvaluation, deleteEvaluation };
