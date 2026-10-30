Lecture de texte (OCR) pour « Lire une capture » des stats, hébergée avec le site.

- tesseract.min.js, worker.min.js : tesseract.js 5.1.0 (licence Apache-2.0)
- tesseract-core-lstm.wasm.js : tesseract.js-core 5.1.1 (licence Apache-2.0)
- fra.traineddata.gz.b64.txt : fra.traineddata.gz encodé en base64 (un .txt est servi partout, y compris dans l'artifact), données de langue française, @tesseract.js-data/fra 4.0.0_best_int (licence Apache-2.0)

Correctif appliqué à worker.min.js : à l'initialisation, une langue passée sous forme d'objet
`{ code, data }` donnait ses données au lieu de son code (`t.data` remplacé par `t.code`).
