.PHONY: install_deps watch

install_deps:
	npm install
	bower install

# requires you to get Ruby and 'bundle install' first
# replaces tup on both OSX (where it lacks a monitor) and
# Windows (where it has too many issues to count)
watch:
	bundle exec guard

