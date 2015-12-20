/* global angular */
/* global d3 */
angular.module('palladioMetavis', ['palladio', 'palladio.services'])
	.run(['componentService', function(componentService) {
		var compileStringFunction = function (newScope, options) {
			var compileString = '<div data-palladio-metavis></div>';
			return compileString;
		};

		componentService.register('metavis', compileStringFunction);
	}])
	.directive('palladioMetavis', function (palladioService, dataService, parseService, $document) {
		return {
			scope : true,
			templateUrl : 'template.html',
			link : {
				pre : function(scope, element) {
					scope.fileForArrowIndexChange = null;
					
					scope.clearArrowEffect = function() {
						scope.fileForArrowIndexChange = null;
					}
					
					scope.reparseFile = function(d) {
            var fields = parseService.getFields(d.data);
						d.fields.forEach(function(f,i) {
              if(!f.type) {
                f.type = fields[i].type;
              }
              scope.reparseField(f,d);
            });
					};
					
					scope.reparseField = function(f, d) {
						// Re-parse uniques...
						var md = parseService.parseColumn(f.key,
							d.data, f.mvDelimiter,
							f.hierDelimiter, [], f.type);
						f.uniques = md.uniques;
						f.uniqueValues = f.uniques.map(function(u) { return u.key; });
						f.sourceType = f.sourceType ? f.sourceType : null;
						
						f.detailType = f.detailType ? f.detailType : (f.type ? f.type : null);
						
						if(f.uniqueKey && f.detailType === "number") {
							f.detailType = 'uniqueNumeric';
						}
						if(f.uniqueKey && f.detailType === "text") {
							f.detailType = 'uniqueText';
						}
						if(f.uniques.length === 2) {
							f.detailType = 'binary0';
						}
						if(f.uniques.length > 2 && f.uniques.length < 10 && f.detailType === 'number') {
							f.detailType = 'ordinalNumeric';
						}
						if(f.uniques.length > 2 && f.uniques.length < 10 && f.detailType === 'text') {
							f.detailType = 'nominalText';
						}
            if(f.detailType === 'numeric') f.detailType = 'number';
            
            if(f.verifiedSpecialChars === undefined) f.verifiedSpecialChars = []; 
					};
					
					scope.reparseUniques = function(f,d) {
						var md = parseService.parseColumn(f.key,
							d.data, f.mvDelimiter,
							f.hierDelimiter, [], f.type);
						f.uniques = md.uniques;
						f.uniqueValues = f.uniques.map(function(u) { return u.key; });
					}
					
					scope.codemirrorLoaded = function(editor) {
						editor.on("drop", function(c, e){
							scope.$apply(function(s) {
								s.lastFileName = e.dataTransfer.files[0].name.replace(/\.[^/.]+$/, "") || null;
							})
						});
					};
					
					scope.lastFileName = null;
					
					scope.downloadFile = function(file) {
            
						var blob = new Blob(
							[ d3.csv.format(file.data) ],
							{type: "text/csv;charset=utf-8"}
						);
						var fileName = file.label + ".csv";
						
            var errorHandler = function (fileName, blob, e) {  
              saveAs(blob, fileName);
            }
            
            var directory = cordova.file.documentsDirectory || cordova.file.dataDirectory || cordova.file.tempDirectory;
            window.resolveLocalFileSystemURL(directory, function (directoryEntry) {
              var dateNow = new Date();
              var fileName = file.label + '-' + dateNow.getFullYear() + '-' +
                (dateNow.getMonth()+1) + '-' + dateNow.getDay() + '-' +
                dateNow.getHours() + '-' + dateNow.getMinutes() + '-' +
                dateNow.getSeconds() + '.csv';
              directoryEntry.getFile(fileName, { create: true }, function (fileEntry) {
                fileEntry.createWriter(function (fileWriter) {
                  fileWriter.onwriteend = function (e) {
                    // for real-world usage, you might consider passing a success callback
                    alert('File "' + fileName + '" saved to documents directory.');
                  };
        
                  fileWriter.onerror = function (e) {
                    // you could hook this up with our global error handler, or pass in an error callback
                    alert('Write failed: ' + e.toString());
                  };
                  fileWriter.write(blob);
                }, errorHandler.bind(null, fileName, blob));
              }, errorHandler.bind(null, fileName, blob));
            }, errorHandler.bind(null, fileName, blob));
					};
					
					scope.selectedFieldMetadata = {};
					scope.selectedFile = {};
					scope.assignSelectedFieldandFile = function(fld, fl) {
						scope.selectedFieldMetadata = fld;
						scope.selectedFile = fl;
					}
					
					scope.colors = {
						uniqueNumeric: '#E0CD29',
						uniqueText: '#E07129',
						numeric: '#BBAA1B',
						number: '#BBAA1B',
						text: '#BB5A1B',
						binary0: '#9988C0',
						binary1: '#CD88BD',
						ordinalNumeric: '#767A79',
						nominalText: '#53585F',
						coordinates: '#A1C088',
						latlong: '#A1C088',
						date: '#577AA4',
						YYYYMMDD: '#577AA4',
						YYYYMM: '#88A1C0',
						YYYY: '#A9BBD2',
						url: '#C0A788',
						'null': '#EEEEEE',
						mismatch: '#EC5D57'
					};

					scope.textColors = {
						uniqueNumeric: '#FFFFFF',
						uniqueText: '#FFFFFF',
						numeric: '#FFFFFF',
						number: '#FFFFFF',
						text: '#FFFFFF',
						binary0: '#FFFFFF',
						binary1: '#FFFFFF',
						ordinalNumeric: '#FFFFFF',
						nominalText: '#FFFFFF',
						coordinates: '#FFFFFF',
						latlong: '#FFFFFF',
						date: '#FFFFFF',
						YYYYMMDD: '#FFFFFF',
						YYYYMM: '#FFFFFF',
						YYYY: '#FFFFFF',
						url: '#FFFFFF',
						'null': '#444444',
						mismatch: '#FFFFFF'
					};
					
					scope.typeTexts = {
						uniqueNumeric: 'Unique Numeric',
						uniqueText: 'Unique Text',
						numeric: 'Numeric',
						number: 'Numeric',
						text: 'Text',
						binary0: 'Binary',
						binary1: 'Binary',
						ordinalNumeric: 'Ordinal Numeric (<10 values)',
						nominalText: 'Nominal Text (<10 values)',
						coordinates: 'Coordinates',
						latlong: 'Coordinates',
						date: 'Date',
						YYYYMMDD: 'Date (YYYY-MM-DD)',
						YYYYMM: 'Date (YYYY-MM)',
						YYYY: 'Date (YYYY)',
						url: 'URL',
						'null': 'not defined',
						mismatch: 'match error'
					}
					
					scope.allowedTypes = [
						{id: 'uniqueNumeric', name: 'Unique Numeric', description: 'Numeric and unique data such as 1234 or 1.234'},
						{id: 'uniqueText', name: 'Unique Text', description: 'Any text-based data that is unique'},
						{id: 'number', name: 'Numeric', description: 'Numeric data such as 1234 or 1.234'},
						{id: 'text', name: 'Text', description: 'Any text-based data'},
						{id: 'binary0', name: 'Binary', description: "Binary data such as Y/N, True/False" },
						{id: 'ordinalNumeric', name: 'Ordinal Numeric', description: "Numeric, categorical data with a limited number (<10) of categories" },
						{id: 'nominalText', name: 'Nominal Text', description: "Text, categorical data with a limited number (<10) or categories" },
						{id: 'coordinates', name: 'Coordinates', description: 'Latitude, Longitude coordinates such as 12.345,67.890'},
						{id: 'date', name: 'Date', description: 'Dates can be YYYY or YYYY-MM-DD'},
						{id: 'url', name: 'URL', description: 'The URL of a website or image such as http://www.example.org/file.yyy'}
					];
					
					scope.sourceTexts = {
						source: 'Directly from source data',
						curated: 'Curated values based on source data',
						authored: 'Authored information',
						generated: 'Generated for visualization or data analysis purposes',
						unknown: 'Unknown source'
					};
					
					scope.sourceTextArray = d3.entries(scope.sourceTexts).map(function(d) {
						d.displayKey = d.key.charAt(0).toUpperCase() + d.key.slice(1);
						return d;
					});
					
					scope.displayVal = function(val) {

						var delimiter = null;
	
						var key = '<span class="small">' + val.key.split(delimiter).reduce(function(prev, curr, i, a) {
							return prev + '&nbsp;'.repeat(i*2) + curr;
						}, "") + '</span>';
	
						var multiples = val.value > 1 ? '<span class="pull-right small muted">' + val.value + '</span>' : '';
	
						return key + multiples;
					};
					
					scope.sortOptions = [
						{ label:'Sort by Value', value:'key', icon: 'fa-sort-alpha-asc', ordering: function(a) { return a.key; } },
						{ label:'Sort by Frequency', value:'value', icon: 'fa-sort-numeric-asc', ordering: function(a) { return -a.value; }}
					];
          
          scope.displayOptions = {
            sortBy : scope.sortOptions[0]
          }
          
          scope.$watch('displayOptions.sortBy', function() {
            scope.sortOrder = scope.displayOptions.sortBy.ordering;
          });
					
					scope.filterSpecials = function(unassigned, verified) {
						if(!verified) { verified = []; }
						return unassigned.filter(function(d) { return verified.indexOf(d) === -1; });
					}
          
          scope.loadSelect = {};
          
          scope.demoFiles = [
            {
              path: 'data/Film_Locations_in_San_Francisco.csv',
              label: 'Film Locations',
              description: 'Accessed December 10, 2015 - <a href="https://data.sfgov.org/Culture-and-Recreation/Film-Locations-in-San-Francisco/yitu-d5am">source at data.sfgov.org</a> (click link to open source page)',
              displayKey: 'Film locations in San Francisco'
            },{
              path: 'data/Mobile_Food_Facility_Permit.csv',
              label: 'Food Permits',
              description: 'Accessed December 10, 2015 - <a href="https://data.sfgov.org/Economy-and-Community/Mobile-Food-Facility-Permit/rqzj-sfat">source at data.sfgov.org</a> (click link to open source page)',
              displayKey: 'Mobile Food Facility Permits'
            },{
              path: 'data/SF_Civic_Art_Collection.csv',
              label: 'SF Civic Art',
              description: 'Accessed December 10, 2015 - <a href="https://data.sfgov.org/Culture-and-Recreation/SF-Civic-Art-Collection/zfw6-95su">source at data.sfgov.org</a> (click link to open source page)',
              displayKey: 'SF Civic Art Collection (partial)'
            }
          ]
				},

				post : function(scope, element, attrs) {
					scope.metadata = dataService.getMetadata();
					scope.files = dataService.getFiles();
					scope.links = dataService.getLinks();
					scope.maxRecords = d3.max(scope.files, function(d) { return d.data.length; });

					scope.files.forEach(scope.reparseFile);
					
					scope.sortFields = function(file) {
						file.fields.forEach(function(f) { scope.sortField(f, file); });
					}
					
					scope.sortField = function(field, file) {
						switch(file.sortMode) {
							case 'Map errors and gaps':
								field.sortedValues = file.data.map(function(d) {
									return d[field.key];
								}).map(function(d) {
									return {
										value: d,
										color: scope.colorCalc(d, 'error', field)
									};
								});
								break;
							case 'Map by data types':
								field.sortedValues = file.data.map(function(d) {
									return d[field.key];
								}).map(function(d) {
									return {
										value: d,
										color: scope.colorCalc(d, 'type', field)
									};
								});
								break;
							case 'Sort by values':
								field.sortedValues = file.data.map(function(d) {
									return d[field.key];
								}).map(function(d) {
									return {
										value: d,
										color: scope.colorCalc(d, 'type', field)
									};
								}).sort(function(a,b) { return a.color < b.color ? -1 : 1; });
								break;
						}
					}
					
					// Set up tooltips
					function setTooltips() {
						setTimeout(function() {
							addTooltips();
						}, 300);	
					}
					function addTooltips() {
						angular.element(element[0]).find('div.dimension-type').tooltip();
						angular.element(element[0]).find('i.source-type').tooltip();
					}
					function removeTooltips() {
						angular.element(element[0]).find('div.dimension-type').tooltip('destroy');
						angular.element(element[0]).find('i.source-type').tooltip('destroy');
					}
					setTooltips();
					
					scope.centerTable = function(ev) {
						// Do this async so that page can re-render first and table container can expand.
						function internalUpdate() {
							var tableNode = ev.currentTarget.parentNode.parentNode.parentNode;
							tableNode.parentNode.scrollLeft = tableNode.parentNode.scrollLeft - 30 + tableNode.getBoundingClientRect().left;
						}
						setTimeout(internalUpdate);
					};

					scope.calcPosition = function(file) {
						if($('.table-display')[scope.files.indexOf(file)].getBoundingClientRect().left < 0 &&
							$('.table-display')[scope.files.indexOf(file)].getBoundingClientRect().right > 500) {
							
							return 'absolute';
						}
						return 'relative';
					};

					$('#tables').scroll(function() { scope.$digest(); });

					scope.colorCalc = function(value, calcType, field) {
						if(calcType === 'error') {
							if(value === null || value === undefined || value === "") return scope.colors['null'];
              var possibleValues = sniffPossible(value);
							if(possibleValues.indexOf(field.detailType) === -1 &&
								!(possibleValues.indexOf('number') > -1 && (field.detailType === 'uniqueNumeric' || field.detailType === 'ordinalNumeric' )) &&
								!(possibleValues.indexOf('text') > -1 && (field.detailType === 'uniqueText' || field.detailType === 'nominalText')) &&
								!(possibleValues.indexOf('text') > -1 && field.detailType === 'uniqueText') &&
								!((value.length === 4 || value.length === 7) && field.detailType === 'date') &&
								field.detailType !== 'binary0' ) {

								return scope.colors.mismatch;
							}
							return '#bbbbbb';
						}
						if(calcType === 'edit') {
							var possibleValues = sniffPossible(value);
							if(possibleValues.indexOf(field.detailType) === -1 &&
								!(possibleValues.indexOf('number') > -1 && (field.detailType === 'uniqueNumeric' || field.detailType === 'ordinalNumeric' )) &&
								!(possibleValues.indexOf('text') > -1 && (field.detailType === 'uniqueText' || field.detailType === 'nominalText')) &&
								!(possibleValues.indexOf('text') > -1 && field.detailType === 'uniqueText') &&
								field.detailType !== 'binary0' ) {

								return scope.colors.mismatch;
							}
							return '#bbbbbb';
						}
						if(calcType === 'type') {
							if(field.detailType === 'ordinalNumeric' && sniff(value) === 'number') {
								return scope.colors['ordinalNumeric'];
							} else if (field.detailType === 'binary0' && field.uniqueValues && (value === field.uniqueValues[0] || value === field.uniqueValues[1])) {
								return value === field.uniqueValues[0] ? scope.colors['binary0'] : scope.colors['binary1'];
							} else if ( (field.detailType === 'ordinalNumeric' || field.detailType === 'nominalText') && value && field.uniqueValues.indexOf(value.split(field.mvDelimiter)[0]) !== -1) {
								return scope.colors[field.detailType];
							} else {
								return scope.colors[sniff(value)];	
							}
						}
					};
					
					scope.assignIndexAndFile = function(file, index) {
						 file.editIndex = index;
						 scope.fileForArrowIndexChange = file;
					}
					
					$document.keydown(function(ev) {
						scope.$apply(function(s) {
							if(ev.keyCode === 27) { s.files.forEach(function(f) { f.editIndex = null; }); }
							if(ev.keyCode === 37 && scope.fileForArrowIndexChange && scope.fileForArrowIndexChange.editIndex > 0) {
								ev.preventDefault();
								scope.fileForArrowIndexChange.editIndex--;
							}
							if(ev.keyCode === 39 && scope.fileForArrowIndexChange && scope.fileForArrowIndexChange.editIndex < scope.fileForArrowIndexChange.data.length-1) {
								ev.preventDefault();
								scope.fileForArrowIndexChange.editIndex++;
							}
						})
					});

					scope.numberWithValue = function(file, field) {
						return file.data.filter(function(d) { return d[field.key] !== null && d[field.key] !== undefined && d[field.key] !== ""; }).length;
					};

					var isBoolean = function(value) {
						return typeof value == 'boolean';
					};

					var isString = function(value){
						return typeof value == 'string';
					};

					var isArray = function(value){
            if(value && value.toString) return value.toString() == '[object Array]';
            return false;
					};

					var isNumber = function(value){
						return typeof value == 'number' || RegExp('^\\d*$').test(value);
					};

					var isObject = function(value){
						return value !== null && typeof value == 'object';
					};

					var isDate = function(value){
						return value.toString() == '[object Date]';
					};

					var isFunction = function(value){
						return typeof value == 'function';
					};

					var isBooleanLike = function(value){
						if (value.toLowerCase() === 'true' || value.toLowerCase() === 'yes' || value === 1 ) return true;
						if (value.toLowerCase() === 'false' || value.toLowerCase() === 'no' || value === 0 ) return true;
						return false;
					};

					var isNumberLike = function(value) {
						if(value && value.replace) return !isNaN(value.replace(',','.'));
            return false;
					};

					var isDateLike = function(value){
						// We allow zero-dates (1999-00-00) even though they aren't technically valid.
						// We allow negative years in dates
						var dateTest = RegExp('^[-]\\d\\d\\d\\d($)|([-](0[0-9]|1[012]|[0-9])[-](0[0-9]|[12][0-9]|3[01]|[0-9])$)');
						if(dateTest.test(value)) return true;
						return false;
					};

					var isLatLonLike = function(value){
            if(value) {
              var pieces = value.split(',');
              if (pieces.length !== 2) return false;
              if (isNumberLike(pieces[0]) && isNumberLike(pieces[1])) return true; 
            }
						return false;
					};

					var isUrlLike = function(value){
						if(value && value.indexOf) if ( value.indexOf("https://") === 0 || value.indexOf("http://") === 0 || value.indexOf("www.") === 0 ) return true;
						return false;
					};
          
					var sniff = function(value) {
						if (typeof value === 'undefined' || value === null || value.length === 0) return 'null';
						if (isObject(value)) return 'object';
						if (isArray(value)) return 'array';
						if (isNumber(value) && value.length === 4) { return 'YYYY'; }
						if (isNumber(value)) return 'number';
						// String
						if (isUrlLike(value)) return 'url';
						//if (isBooleanLike(value)) return 'boolean';
						if (isDateLike(value) && value.length === 4) return 'YYYY';
						if (isDateLike(value) && value.length === 7) return 'YYYYMM';
						// if (isDateLike(value) && value.length === 10) return 'YYYYMMDD';
						if (isDateLike(value)) return 'date';
						if (isNumberLike(value)) return 'number';
						if (isLatLonLike(value)) return 'latlong';
						if (isString(value)) return 'text';
						return null;
					};
          
          var sniffPossible = function(value) {
            var arr = [];
            if (isObject(value)) arr.push('object');
						if (isArray(value)) arr.push('array');
						if (isNumber(value) && value.length === 4) { arr.push('YYYY'); }
						if (isNumber(value)) arr.push('number');
						// String
						if (isUrlLike(value)) arr.push('url');
						//if (isBooleanLike(value)) return 'boolean';
						if (isDateLike(value) && value.length === 4) arr.push('YYYY');
						if (isDateLike(value) && value.length === 7) arr.push('YYYYMM');
						// if (isDateLike(value) && value.length === 10) return 'YYYYMMDD';
						if (isDateLike(value)) arr.push('date');
						if (isNumberLike(value)) arr.push('number');
						if (isLatLonLike(value)) arr.push('latlong');
						if (isString(value)) arr.push('text');
            return arr;
          }
					
					scope.updateMetadata = function() {
						scope.reparseUniques(scope.selectedFieldMetadata, scope.selectedFile);
            scope.sortField(scope.selectedFieldMetadata, scope.selectedFile);
						removeTooltips();
						setTooltips();
					}
					
					scope.updateUniques = scope.updateMetadata;
					
          scope.loadData = function(filePath, fileName) {
            try {
              parseService.parseUrl(filePath).then(
                function(csv){
                  var url = filePath;
                  var data = parseService.parseText(csv);
                  dataService.addFile(data, fileName ? fileName : "From URL", url);
                  scope.reparseFile(dataService.getFiles()[dataService.getFiles().length-1]);
                  scope.loadSelect = {};
                  setTooltips();
                },
                function(error){
                  scope.parseError = error;
                });
            } catch(error) {
              scope.parseError = error.message;
            }
            setTooltips();
          }
          
					scope.addFile =  function(text, fileName){
	
						// if no text return
						if (!text || !text.length) return;
						scope.parseError = false;
						// let's see if the text is a URL.
						if (text.indexOf("http") === 0 && text.indexOf("\n") === -1) {
							try {
								parseService.parseUrl(text).then(
									function(csv){
										var url = text;
										var data = parseService.parseText(csv);
										dataService.addFile(data, "From URL", url);
										scope.reparseFile(dataService.getFiles()[dataService.getFiles().length-1]);
										setTooltips();
									},
									function(error){
										scope.parseError = error;
									});
							} catch(error) {
								scope.parseError = error.message;
							}
							return;
						}
	
						try {
							var data = JSON.parse(text);
	
							dataService.addFile(data, scope.lastFileName);
							scope.lastFileName = null;
							scope.reparseFile(dataService.getFiles()[dataService.getFiles().length-1]);
							return;
						} catch(error) {
							try {
								var data = parseService.parseText(text);
								
								dataService.addFile(data, scope.lastFileName);
								scope.lastFileName = null;
								scope.reparseFile(dataService.getFiles()[dataService.getFiles().length-1]);
							} catch(error) {
								scope.parseError = error.message;
							}
						}
						setTooltips();
					};
				}
			}
		};
	});
