var Article = require('../models/article')
var User = require('../models/user')
var Troc = require('../models/troc')

function createArticle(req, res, next) {
	if (!Array.isArray(req.body)) {
		var art = new Article(req.body)

		createArticleContext(art.troc, art.provider, 1, (err, newRef) => {
			if (err) return next(err)
			art.ref = newRef
			art.save(err => {
				if (err) return next(err)
				res.json({success: true, message: art})
			})						
		})
		
	}else{
		var articles = req.body
		createArticleContext(articles[0].troc, articles[0].provider, articles.length, (err, newRef) => {
			if (err) return next(err)

			articles.forEach(art  => delete art._id)
	
			Promise.all(articles.map((art, i) => {
				return new Promise((resolve, reject) => {
					art = new Article(art)
					art.ref = newRef + i
					art.save(err => {
						if (err) return reject(err)
						else return resolve(art)
					})
				})
			}))			
			.catch(next)	
			.then(articles => {
				res.json({success: true, message: articles})
			})
		})
	}
}

function createArticleContext(trocId, providerId, nombreArticles, cb) {
	Troc.findOne({_id: trocId}, (err, troc) => {
		if (err || !troc) return cb(err || Error('Troc is not found !'))

		User.findOne({_id: providerId}, (err, user) => {
			if (err || !user) return cb(err || Error('Provider is not found !'))

			let newRef = troc.articlelastref + 1 //Reference
			troc.articlelastref += nombreArticles

			if (user.trocs.indexOf(troc._id) == -1) {
				user.trocs.push(troc._id)
				troc.provider.push(user._id)
				user.save(err => {
					if (err) return cb(err)
					troc.save(err => cb(err, newRef, troc, user))
				})
			}else{
				troc.save(err => cb(err, newRef, troc, user))
			}
		})

	})
}


//Not used
function validArticle(req, res, next) {
	if(!Array.isArray(req.body)) {
		Article.findOne({_id: req.body._id}, (err, art) => {
			if (err || !art) return next(err || Error('Article not found'))
			art.valided = req.body.valided
			art.save(err => {
				if (err) return next(err)
				res.json({success: true, message: art})
			})
		})
	}else {
		var ids = req.body.map(a => a._id)
		Articles.find({_id: {$in: ids}}, (err, articles) => {
			if (err) next(err)
			Promise.all(articles.map(artUpdated => {
				return new Promise((resolve, reject) => {
					art.valided = artUpdated.valided
					art.save(err => {
						if (err) return reject(err)
						resolve(art)
					})	
				})
			}))
			.catch(next)
			.then(articles => {
				res.json({success: true, message: articles})
			})			
		})

	}
}

function deleteArticle(req, res, next) {
	Article.findOne({_id: req.params.id}, (err, art) => {
		if (err || !art) return next(err || Error('Article not found'))
		art.remove(err => {
			if (err) return next(err)
			res.json({success: true, message: `Article ${req.params.id} is removed`})
		})
	})
}

module.exports = {
	createArticle,
	validArticle,
	deleteArticle
}