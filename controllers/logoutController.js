import asyncHandler from "express-async-handler";

export default asyncHandler(async(req, res) => {
    let email = req.body.email;
    delete global.loggedData[`${email}`];

    res.json("deleted succeed");
});