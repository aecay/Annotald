.PHONY: docs

docs:
	sphinx-build -b html -a doc build/doc
