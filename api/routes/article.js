let express = require('express')
let router = express.Router()

let { 	createArticle,
		editArticle,
		deleteArticle,
		goBackArticle,
		patchArticle,
		createNewPriceRequest,
		acceptNewPriceRequest	} = require('../controllers/article_set')
let { searchArticle, getArticle } = require('../controllers/article_get')
let { checkLogin } = require('../controllers/user_utils')

router
	.post('/', 			checkLogin, 		createArticle)
	.post('/edit', 		checkLogin, 		editArticle)
	.post('/giveback', 	checkLogin,			goBackArticle)
	.post('/newprice', 	checkLogin,			createNewPriceRequest)
	.post('/acceptnewprice', 	checkLogin,	acceptNewPriceRequest)
	.delete('/:id', 	checkLogin,			deleteArticle)
	.patch('/', 		checkLogin, 		patchArticle)
	.get('/', 			searchArticle)
	.get('/:id', getArticle)

module.exports = router
