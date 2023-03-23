const ApiError = require('../exceptions/api-error')

module.exports = function (err, req, res, next) {
    console.log(err)
    if (err instanceof ApiError) {
        return res.status(err.status).json({message: err.message, errors: err.errors})
    }
    console.log("fuck it", err)
    return res.status(500).json({message: 'Unexpected error'})
}