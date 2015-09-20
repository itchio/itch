.PHONY: install_deps


install_deps:
	npm install
	bower install

# requires ruby gem 'filewatcher', stopgap measure
# for tup's lack of monitor support on OSX
watch:
	filewatcher '**/*.coffee' '**/*.scss' 'tup upd'

