import bcrypt from "bcrypt";

const password = "Test@123";

const hash = await bcrypt.hash(password, 12);

console.log(hash);

