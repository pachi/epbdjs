SRCDIR:=src
BUILDDIR:=lib

test: ${BUILDDIR}/test.js ${BUILDDIR}/examples
	node ${BUILDDIR}/test.js

installpackages:
	$(info [INFO]: instalación de paquetes)
	curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
	sudo aptitude install nodejs

clean:
	rm -rf lib/

${BUILDDIR}:
	mkdir -p ${BUILDDIR}

${BUILDDIR}/cteepbd.js: ${SRCDIR}/cteepbd.js
	./node_modules/.bin/babel -o ${BUILDDIR}/cteepbd.js ${SRCDIR}/cteepbd.js

${BUILDDIR}/vecutils.js: ${SRCDIR}/vecutils.js
	./node_modules/.bin/babel -o ${BUILDDIR}/vecutils.js ${SRCDIR}/vecutils.js

${BUILDDIR}/energycalculations.js: ${BUILDDIR} ${SRCDIR}/energycalculations.js ${BUILDDIR}/cteepbd.js ${BUILDDIR}/vecutils.js
	./node_modules/.bin/babel -o ${BUILDDIR}/energycalculations.js ${SRCDIR}/energycalculations.js

${BUILDDIR}/test.js: ${BUILDDIR} ${BUILDDIR}/energycalculations.js ${SRCDIR}/test.js
	./node_modules/.bin/babel -o ${BUILDDIR}/test.js ${SRCDIR}/test.js

${BUILDDIR}/examples:
	cp -r ./${SRCDIR}/examples ./${BUILDDIR}

