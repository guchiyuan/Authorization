var express = require('express');

function ErrorHandler(err, req, res, next){
    
    res.json({msg:err.msg,code:err.code});
}

module.exports={
    ErrorHandler:ErrorHandler
}