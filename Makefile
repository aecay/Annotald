.PHONY: docs website js deploy

docs:
	sphinx-build -b html -a doc build/doc

js:
	grunt build

website: docs js
	rm -r build/deploy
	mkdir -p build/deploy
	cp website/* build/deploy
	cp -r build/doc build/deploy
	cp -r build/webapp build/deploy/go

deploy: website
	HTTP_PROXY= HTTPS_PROXY= s3_website push --site build/deploy
