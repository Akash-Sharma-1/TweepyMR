jsph
===========

jsph (pronounced like the name joseph) is the fusion of the php templating syntax
with the javascript language to form a rediculously simple node.js
template engine.

if you know javascript, and you know php, then you already know jsph.

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

## Sample Templates

	<?	var someValues = ["World", "node.js", "jsph"];
		for(i in someValues) { ?>
		Hello <?= someValues[i] ?>!
	<?	} ?>

the above code would output the following

	Hello World!
	Hello node.js!
	Hello jsph!
