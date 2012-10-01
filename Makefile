TESTS = test/*.js
REPORTER = dot

test:
	@NODE_ENV=test ./node_modules/.bin/mocha \
		--require should \
		--reporter $(REPORTER) \
		--timeout 200 \
		--growl \
		$(TESTS)
	
.PHONY: test-cov test docs test-docs clean

