SRCDIR:=src
BUILDDIR:=lib

test: ${BUILDDIR}/test.js ${BUILDDIR}/examples
	node ${BUILDDIR}/test.js

installpackages:
	$(info [INFO]: instalación de paquetes)
	curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
	sudo aptitude install nodejs

flow:
	flow

clean:
	rm -rf lib/

${BUILDDIR}:
	mkdir -p ${BUILDDIR}

${BUILDDIR}/cte.js: ${BUILDDIR} ${SRCDIR}/cte.js
	./node_modules/.bin/babel -o ${BUILDDIR}/cte.js ${SRCDIR}/cte.js

${BUILDDIR}/vecops.js: ${BUILDDIR} ${SRCDIR}/vecops.js
	./node_modules/.bin/babel -o ${BUILDDIR}/vecops.js ${SRCDIR}/vecops.js

${BUILDDIR}/epbd.js: ${BUILDDIR} ${BUILDDIR}/vecops.js ${SRCDIR}/epbd.js
	./node_modules/.bin/babel -o ${BUILDDIR}/epbd.js ${SRCDIR}/epbd.js

${BUILDDIR}/index.js: ${BUILDDIR} ${BUILDDIR}/epbd.js ${BUILDDIR}/cte.js ${BUILDDIR}/vecops.js ${SRCDIR}/index.js
	./node_modules/.bin/babel -o ${BUILDDIR}/index.js ${SRCDIR}/index.js

${BUILDDIR}/test.js: ${BUILDDIR} ${BUILDDIR}/index.js ${SRCDIR}/test.js
	./node_modules/.bin/babel -o ${BUILDDIR}/test.js ${SRCDIR}/test.js

${BUILDDIR}/examples:
	cp -r ./${SRCDIR}/examples ./${BUILDDIR}

