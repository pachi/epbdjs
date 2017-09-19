PRJDIR:=/home/webapps/visorepbd
RESDIR:=${PRJDIR}/deployresources
REPODIR:=${PRJDIR}
BUILDDIR:=build
NGINXCONF:=visorepbd.nginx.conf
# usar variable de entorno EPBDURLPREFIX para cambiar prefijos de static y url para ajax
EPBDURLPREFIX:=/visorepbd/

test: ${BUILDDIR}/test.js ${BUILDDIR}/examples
	node build/test.js

installpackages:
	$(info [INFO]: instalación de paquetes)
	sudo aptitude install git
	sudo aptitude install nodejs nodejs-legacy

${BUILDDIR}:
	mkdir -p ${BUILDDIR}

${BUILDDIR}/cteepbd.js: app/cteepbd.js
	./node_modules/.bin/babel --presets es2015,stage-0 -o ${BUILDDIR}/cteepbd.js app/cteepbd.js

${BUILDDIR}/vecutils.js: app/vecutils.js
	./node_modules/.bin/babel --presets es2015,stage-0 -o ${BUILDDIR}/vecutils.js app/vecutils.js

${BUILDDIR}/energycalculations.js: ${BUILDDIR} app/energycalculations.js ${BUILDDIR}/cteepbd.js ${BUILDDIR}/vecutils.js
	./node_modules/.bin/babel --presets es2015,stage-0 -o ${BUILDDIR}/energycalculations.js app/energycalculations.js

${BUILDDIR}/test.js: ${BUILDDIR} ${BUILDDIR}/energycalculations.js app/test.js
	./node_modules/.bin/babel --presets es2015,stage-0 -o ${BUILDDIR}/test.js app/test.js

${BUILDDIR}/examples:
	ln -s ../app/examples ${BUILDDIR}/

