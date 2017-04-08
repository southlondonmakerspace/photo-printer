var config = require( __dirname + '/config.json' );
var __watch = __dirname + '/watch-folder';
var __fonts = __dirname + '/fonts';

var fs = require( 'fs' );
var PDFDocument = require( 'pdfkit' );
var ipp = require( 'ipp' );

var printer = ipp.Printer( config.printer );
var buffers = {};

// Watch folder for new files
fs.watch( __watch, function( event, filename ) {
	if ( event == 'rename' ) {
		var ext = filename.split( '.' );
		if ( ext.length > 1 && ext[ ext.length - 1 ] == 'json' ) {
			if ( fs.existsSync( __watch + '/' + ext[0] + '.jpg' ) ) {
				processPrint( filename );
			}
		}
	}
} );

function processPrint( filename ) {
	var data = require( __watch + '/' + filename );
	buffers[ filename ] = [];

	var doc = new PDFDocument( {
		size: [ pt(100), pt(148) ],
		layout: 'portrait',
		margin: 0
	} );

	doc.on( 'data', buffers[ filename ].push.bind( buffers[ filename ] ) );

	doc.on( 'end', function() {
		print( buffers[ filename ], filename );
	} );

	// Photo
	doc.image( __watch + '/' + filename.split('.')[0] + '.jpg', 0, 0, {
		width: pt(100),
		height: pt(100)
	} );

	// Name
	doc.font( __fonts + '/SourceSansPro-Black.otf' );
	doc.fontSize( 22 );
	doc.text( data.name, pt( 7 ), pt( 105 ) );

	// Username
	doc.font( __fonts + '/SourceSansPro-Regular.otf' );
	doc.fontSize( 14 );
	doc.text( "@" + data.username, pt( 7 ), pt( 113 ) );

	// Fun fact
	doc.fontSize( 12 );
	doc.text( data.fact, pt( 7 ), pt( 123 ), { width: pt( 86 ) } );

	doc.end();
}

function print( buffer, filename ) {
	var file = {
		"operation-attributes-tag": {
			"requesting-user-name": "Kiosk",
			"job-name": filename.split('.')[0],
			"document-format": "application/pdf"
		},
		data: Buffer.concat( buffer )
	};

	printer.execute( "Print-Job", file, function ( err, res ) {
		console.log( filename + " – printing: " + res.statusCode );
		var photo = filename.split('.')[0] + '.jpg';
		fs.rename( __watch + '/' + filename, __watch + '/processed/' + filename, function() {} );
		fs.rename( __watch + '/' + photo, __watch + '/processed/' + photo, function() {} );
		delete buffers[ filename ];
		// setTimeout( function() {
		// 	buffers.remove( filename );
		// }, 10000 )
	});
}

function pt( mm ) {
	return mm * 2.834645669291;
}
