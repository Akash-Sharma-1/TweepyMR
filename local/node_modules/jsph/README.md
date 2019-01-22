# jsph

jsph (pronounced like the name joseph) is an extreemly lightweigth implementation
of php/asp style open/close tags with javascript used as the coding language.

if you know javascript, and you know php, then you already know jsph.

if jsph is too feature poor for you, you shoud consider ejs instead, this is basically
the same thing scaled back to have absolutely zero non-essential features.

## Installation
	npm install jsph

## Usage

jsph supports either php style tags, or asp style tags <? ... ?>  or <% ... %>
it also supports <?= ... ?> for easily outputing computed values.

'nough sed.

just in case the above description isnt sufficient to get you started, here is some sample jsph:


	var jsph = require('jsph');
	console.log(jsph.render("today is <?= new Date().toJSON().slice(0,10) ?>")
	console.log(jsph.renderFileSync('./myfile.jsph'));
	jsph.renderFile('.myfile.jsph', function(err, output) {
		if (err) console.log(err);
		else console.log(ouput);
	});

you can also pass an object into a template and access it via "this"

	var template = "Hello, <?= this.name ?>!";
	var templateParams = { name: "World"}
	var output = jsph.render(template, templateParams);
	console.log(output); // -> "Hello, World!"


## Example Template

	<?	var someValues = ["World", "node.js", "jsph"];
		for(i in someValues) { ?>
		Hello <?= someValues[i] ?>!
	<?	} ?>

the above code would output the following

	Hello World!
	Hello node.js!
	Hello jsph!


## Example of using Compile()

if you intend to use the same template multiple times, you can save some time by
compiling it once and using the compiled version of the template to render rather
than calling jsph.render ... which compiles the template on the fly.

	var jsph = require('jsph');
	var template = "Hello, <?= this.name ?>!";
	var renderTemplate = jsph.compile(template);
	var output = renderTemplate({ name: "test"});
	colsole.log(output); // -> "Hello, test!"

	// there is also a compileFile(path, vars, callback(err, renderFunction))
	// and compileFileSync(path, vars)

## Example usage in html / js running in a browser window

NOTE: Only compile() and render() are supported in the browser, the "renerFile" and "renderFileSync" are not supported client side.

	<html>
		<head>
			<title>json template sample</title>
			<script src="../src/jsph.js"></script>
		<head>
		<body onload="on_body_load();">
			<h1> here is some dynamically created content </h1>
			<div id="target"></div>
			<script id="template" type="text/template">
				<ul>
				<? for (var i = 1; i <= 100; i++) {
					?><li>entry #<?= i ?><?
				} ?>
				<ul>
			</script>
			<script type="text/javascript">
				function on_body_load() {
					var template = document.getElementById("template").innerHTML;
					var renderTemplate = jsph.compile(template);
					var targetDiv = document.getElementById("target");
					targetDiv.innerHTML = renderTemplate();
				}
			</script>
		</body>
	</html>
