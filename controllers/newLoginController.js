import asyncHandler from 'express-async-handler'; 

export default asyncHandler(async (req, res) => {
    global.loggedData[`${req.body.totkenObj.user.email}`] =req.body.totkenObj;
    //console.log(global.loggedData);
    res.json("request accepted");
  });