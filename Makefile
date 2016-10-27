PRJDIR:=/home/webapps/epbdpanel
RESDIR:=${PRJDIR}/deployresources
REPODIR:=${PRJDIR}
NGINXCONF:=epbdpanel.nginx.conf
# usar variable de entorno EPBDURLPREFIX para cambiar prefijos de static y url para ajax
EPBDURLPREFIX:=/epbdpanel/

.PHONY: builddevjs
builddevjs:
	$(info [INFO]: Generando bundle JS para desarrollo)
	npm run builddev
.PHONY: buildjs
buildjs:
	$(info [INFO]: Generando bundle JS de producción)
	npm run buildprod

buildprodjs:
	$(info [INFO]: Generando bundle JS de producción con prefijo de URL)
	EPBDURLPREFIX=${EPBDURLPREFIX} make buildjs

# antes hacer un git pull
update: updaterepo
	$(info [INFO]: actualización del proyecto completada. Complete la operación con $ sudo make restart)

updaterepo: ${REPODIR}/package.json updateresources
	$(info [INFO]: actualizando dependencias)
	cd ${REPODIR} && npm install

updateresources:
	$(info [INFO]: actualizando recursos de despliegue)

restart: updateresources ${RESDIR}/${NGINXCONF}
	$(info [INFO]: copiando configuración)
	sudo cp ${RESDIR}/${NGINXCONF} /etc/nginx/sites-available/
	$(info [INFO]: reiniciando servicios)
	sudo service nginx restart

npminstall:
	$(info [INFO]: Instalación de nodejs y dependencias JS)
	curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
	sudo apt-get install -y nodejs
	sudo npm install -g eslint babel-eslint eslint-plugin-react http-server webpack webpack-dev-server
	npm install

.PHONY: analyze
analyze:
	$(info [INFO]: Estadísticas de rendimiento de webpack)
	webpack --json > stats.json
	webpack-bundle-size-analyzer stats.json
installpackages:
	$(info [INFO]: instalación de paquetes)
	sudo aptitude install nginx git
	sudo aptitude install nodejs nodejs-legacy

configpackages:
	$(info [INFO]: copiando archivos de configuración de nginx)
	sudo cp ${RESDIR}/${NGINXCONF} /etc/nginx/sites-available/
	sudo ln -fs /etc/nginx/sites-available/${NGINXCONF} /etc/nginx/sites-enabled/${NGINXCONF}

energycalculations.js:
	./node_modules/.bin/babel --plugins lodash --presets es2015,stage-0 -o build/energycalculations.js app/energycalculations.js

test.js:
	./node_modules/.bin/babel --plugins lodash --presets es2015,stage-0 -o build/test.js app/test.js

examples:
	cp -r app/examples build/examples

test: energycalculations.js test.js examples
	node build/test.js

