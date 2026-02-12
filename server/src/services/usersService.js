const bcrypt = require("bcryptjs");
const usersModel = require("../models/usersModel");

const getAll = async () => {
  return await usersModel.getAll();
};

const getById = async (id) => {
  const user = await usersModel.getById(id);
  if (!user) throw { status: 404, message: "User not found" };
  return user;
};

const create = async ({ username, email, password, role }) => {
  if (!username || !email || !password || !role) {
    throw { status: 400, message: "Username, email, password and role are required" };
  }

  const existing = await usersModel.findByEmail(email);
  if (existing) throw { status: 409, message: `Email '${email}' is already registered` };

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);

  const id = await usersModel.create({ username, email, password: hashed, role });
  return await usersModel.getById(id);
};

const update = async (id, { username, email, role, password }) => {
  if (!username || !email || !role) {
    throw { status: 400, message: "Username, email and role are required" };
  }

  const existing = await usersModel.findByEmail(email, id);
  if (existing) throw { status: 409, message: `Email '${email}' is already registered` };

  await usersModel.update(id, { username, email, role });

  if (password && password.trim() !== "") {
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password.trim(), salt);
    await usersModel.updatePassword(id, hashed);
  }

  return await usersModel.getById(id);
};

const deactivate = async (id) => {
  const user = await usersModel.getById(id);
  if (!user) throw { status: 404, message: "User not found" };
  await usersModel.deactivate(id);
};

module.exports = { getAll, getById, create, update, deactivate };
