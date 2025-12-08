const express = require('express')

const router = express.Router()

router.get('/tvcandidates', async (req, res, next) => {
  try {
    const idsParam = req.query.ids || ''
    const ids = idsParam.split(',').map(s => s.trim()).filter(Boolean)
    if (!ids.length) return res.status(400).json({ error: 'Missing ids query parameter' })


    const result = ids.reduce((acc, id) => {
      acc[id] = []
      return acc
    }, {})

    res.json({ candidates: result })
  } catch (err) {
    next(err)
  }
})

module.exports = router
