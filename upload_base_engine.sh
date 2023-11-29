#!/bin/bash

cd ./tools/UploadEngineByTag && npm install && cd ../../ && node ./tools/UploadEngineByTag/index.js $*
