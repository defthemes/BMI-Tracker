var BMI = BMI && {};

BMI = {
    gender: 1, //1 = female, 2 = male
    metrics: 2, // 1 = imperial, 2 = metric
    resCol: 0,
    results: ['vsu', 'su', 'u', 'n', 'o', 'o1', 'o2'],
    results2: ['vsu', 'u', 'n', 'o1', 'o2'],
    results3: ['vsu', 'u', 'n', 'o', 'o1', 'o2'],
    save: 1, // 1- true, 0 - false
    bmiDB: null,
    lastId: null,
    enableAds: true,
    locals: {},
    localStorage: null,
    chartData: [],
    init: function () {
        $.mobile.linkBindingEnabled = true;
        $.mobile.ajaxEnabled = true;

        BMI.checkLocalStorage();
        BMI.attachEventListeners();
    },
    attachEventListeners: function () {
        var swiperHeight = window.innerHeight;
        var swiperWidth = window.innerWidth;
        swiperHeight = ( swiperHeight * 20 ) / 100;
        $('#menu .swiper-container').css('height', '100%').css('width', swiperWidth);
        var swiper = new Swiper('.swiper-container', {
            slidesPerView: 2,
            paginationClickable: true,
        });

        BMI.addScrollbar();

        document.addEventListener('deviceready', BMI.common, false);
        document.addEventListener("resume", BMI.onAppResume, false);

        $('.metrics .form-group i').click( function (e) {
            $('i.fa-female, i.fa-male').removeClass('selected');
            $(this).addClass('selected');
            BMI.gender = $(this).data('gender');
            BMI.localStorage.setItem('gender', BMI.gender);
        });

        $('[type="radio"]').change(function (e) {
            BMI.metrics = $(this).val();
            BMI.changeMetricLabels();
        });

        $('#saveData').change(function (e) {
            if ( $(this).is(':checked') )
                BMI.localStorage.setItem('saveData', true);
            else
                BMI.localStorage.setItem('saveData', false);
        });

        $('#enableNotifications').change(function (e) {
            if ( $(this).is(':checked') )
            {
                BMI.localStorage.setItem('notifications', true);
                // var now             = new Date().getTime(),
                //     monday_9_am = new Date(now + 25*1000);
                cordova.plugins.notification.local.schedule({
                    id: 25,
                    title: "Dont't forget to check your Weight!",
                    text: "Get up and do something.",
                    at: monday_9_am,
                    icon: 'res://icon',
                    every: "second"
                });
            }
            else
            {
                BMI.localStorage.setItem('notifications', false);
                cordova.plugins.notification.local.cancel(25, function () {});
            }
        });

        $('#calculateBMI').on('click', function (e) {
            var bmi = null;
            if ( BMI.metrics == 1 )
                bmi = BMI.calculateBMIImperial();
            else
                bmi = BMI.calculateBMIMetric();

            BMI.positionArrow(bmi);
        });

        $('#calculateBMR').on('click', function (e) {
            var bmr = null;
            if ( BMI.metrics == 1 )
                bmr = BMI.calculateBMRImperial();
            else
                bmr = BMI.calculateBMRMetric();

            if ( bmr > 0 )
            {
                BMI.calculateEnergyExpanditure(bmr);
                $('[name="activity"]').change(function (e) {
                    e.preventDefault();
                    BMI.calculateEnergyExpanditure(bmr);
                });
            }
        });

        $('#calculateBFP').on('click', function (e) {
            var bfp = null;
            bfp = BMI.calculateBFP();

            if ( bfp > 0 )
            {
                BMI.positionArrowBFP(bfp);
            }
        });

        $('#calculateWTHR').on('click', function (e) {
            var wthr = null;
            wthr = BMI.calculateWTHR();

            if ( wthr > 0 )
            {
                BMI.positionArrowWTHR(wthr);
            }
        });

        $('#shareBtn').on('click', function (e) {
            window.plugins.socialsharing.share('http://www.defthemes.com/');
        });

        $('#resetData').on('click', function (e) {
            e.preventDefault();
            BMI.eraseDB();
            BMI.localStorage.clear();
            // setTimeout(function () {
                $('#reset').dialog("close");
            // }, 500);
        });

        $(document).on("pagebeforeshow", function (e, data) {
            var currentPage =  data.toPage[0].id;
            BMI.localStorage.setItem('currentPage', currentPage);
            // console.log('pagebeforeshow');
            // console.log( (BMI.localStorage.getItem('firstrun')) ? 'yes' : 'no' );
            if ( !BMI.localStorage.getItem('firstrun') )
            {
                BMI.runSetup();
            }

            if ( currentPage == "calculate" )
            {
                var input = null;
                var height = BMI.localStorage.getItem('height');
                input = $('#bmi #bmi_height, #bmr #bmr_height, #bfp #bfp_height, #wthr #wthr_height');
                input.val(height).slider( "refresh" );

                var weight = BMI.localStorage.getItem('weight');
                input = $('#bmi #bmi_weight, #bmr #bmr_weight, #bfp #bfp_weight');
                input.val(weight).slider( "refresh" );

                var gender = BMI.localStorage.getItem('gender');
                $('[data-gender]').each(function () {
                    if ( $(this).data('gender') == gender )
                        $(this).addClass('selected');
                });

                var metrics = BMI.localStorage.getItem('metrics');
                $('[data-metric]').each(function () {
                    $(this).removeAttr('checked');
                    if ( $(this).val() == metrics )
                        $(this).prop('checked', true);
                });
            }

            if ( currentPage == "menu" )
            {
                BMI.getAllData(function () {
                    BMI.generateCharts();
                });


                var currentWeight = BMI.localStorage.getItem('weight');
                console.log(currentWeight);
                var metrics = BMI.localStorage.getItem('metrics');
                var metricText = (metrics == "2") ? 'Kg' : 'Lbs';
                if ( currentWeight && metricText )
                    $('#menu #currentWeight').text(currentWeight + ' ' + metricText);
                
                var currentWeightDate = BMI.localStorage.getItem('currentWeightDate');
                if ( currentWeightDate )
                    $('#menu #currentWeightDate').text(currentWeightDate);

                var currentBMI = BMI.localStorage.getItem('bmi');
                if ( currentBMI )
                    $('#menu #currentBMI').text(parseFloat(currentBMI).toFixed(1));

                var currentBMR = BMI.localStorage.getItem('bmr');
                if ( currentBMR )
                    $('#menu #currentBMR').text(parseFloat(currentBMR).toFixed(1));

                var currentBMIDate = BMI.localStorage.getItem('currentBMIDate');
                if ( currentBMIDate )
                    $('#menu #currentBMIDate').text(currentBMIDate);

                var currentBMRDate = BMI.localStorage.getItem('currentBMRDate');
                if ( currentBMRDate )
                    $('#menu #currentBMRDate').text(currentBMRDate);
            }
        });
    },
    checkLocalStorage: function () {
        BMI.localStorage = window.localStorage;
        if ( BMI.localStorage ) {
            // We have localStorage
            // Get the value of saveData ... if doeas not exists create it
            // that means that this is the first time the app is running
            var saveData = BMI.localStorage.getItem('saveData');
            if ( !saveData )
                BMI.localStorage.setItem('saveData', true);

            var hasResults = BMI.localStorage.getItem('hasResults');
            if ( !hasResults )
                BMI.localStorage.setItem('hasResults', false);


            var notifications = BMI.localStorage.getItem('notifications');
            if ( !notifications )
                BMI.localStorage.setItem('notifications', true);

            // Check if we have all the needed data so we can pre-populate the inputs!!!!
            if ( !BMI.localStorage.getItem('gender') )
                BMI.localStorage.setItem('gender', BMI.gender);

            if ( !BMI.localStorage.getItem('metrics') )
                BMI.localStorage.setItem('metrics', BMI.metrics);

            var keys = ['height', 'weight', 'waist', 'neck', 'age'], keysLen = keys.length, i;
            for (i=0;i<keysLen;i++)
            {
                if ( BMI.localStorage.getItem(keys[i]) )
                    $('[data-' + keys[i] + ']').val(BMI.localStorage.getItem(keys[i]));
            }

            $('[data-gender]').removeClass('selected');

            $('#menu #name').text(BMI.localStorage.getItem('name'));
        }
    },
    onAppResume: function () {
        // alert('was resumed ... run the return to first page!');
        $('body').pagecontainer( "change", "#menu", { role: "page", transaction: "fade" } );
        
        BMI.getAllData(function () {
            BMI.generateCharts();
        });

        var notifications = BMI.localStorage.getItem('notifications');
        if ( notifications )
            $('#enableNotifications').prop('checked', true);
        else
            $('#enableNotifications').removeAttr('checked');

        var saveData = BMI.localStorage.getItem('saveData');
        if ( saveData )
            $('#saveData').prop('checked', true);
        else
            $('#saveData').removeAttr('checked');
    },
    common: function () {
        if ( BMI.enableAds )
            admobfunc.init();
        
        if ( BMI.save )
            BMI.openDB();

        $(document).on("pagecontainerbeforeshow", function (e, ui) {
            var toPageId = ui.toPage.attr('id');
        });

        if ( BMI.localStorage.getItem('notifications') )
            BMI.localNotification();
        
        BMI.getAllData(function () {
            BMI.generateCharts();
        });
    },
    localNotification: function () {
        // var now             = new Date().getTime(),
        //     monday_9_am = new Date(now + 25*1000);
        cordova.plugins.notification.local.schedule({
            id: 25,
            title: "Dont't forget to check your Weight!",
            text: "Get up and do something.",
            at: monday_9_am,
            icon: 'res://icon',
            every: "second"
        });
    },
    eraseDB: function () {
        BMI.openDB();

        BMI.bmiDB.transaction(function(transaction) {
            var executeQuery = "DROP TABLE IF EXISTS history";
            transaction.executeSql(executeQuery, [], function (tx, results) {}, null);
        });
        BMI.checkDB();
    },
    checkDB: function () {
        BMI.openDB();

        BMI.bmiDB.transaction(function(transaction) {
            var executeQuery = "SHOW TABLES;";
            transaction.executeSql('SELECT COUNT(id) as count FROM history;', [], function (tx, results) {
                results.rows[0].count;
            })
        });
    },
    demoData: function () {
        BMI.openDB();

        BMI.bmiDB.transaction(function(transaction) {
            var executeQuery = "INSERT INTO history (test, result, weight) VALUES(?,?,?)";
            transaction.executeSql(executeQuery, [Math.random(), Math.random(), Math.random()], function (tx, results) {
                console.log(tx);
                console.log(results);
            }, null);
            transaction.executeSql(executeQuery, [Math.random(), Math.random(), Math.random()], function (tx, results) {
                console.log(tx);
                console.log(results);
            }, null);
            transaction.executeSql(executeQuery, [Math.random(), Math.random(), Math.random()], function (tx, results) {
                console.log(tx);
                console.log(results);
            }, null);
            transaction.executeSql(executeQuery, [Math.random(), Math.random(), Math.random()], function (tx, results) {
                console.log(tx);
                console.log(results);
            }, null);
            transaction.executeSql(executeQuery, [Math.random(), Math.random(), Math.random()], function (tx, results) {
                console.log(tx);
                console.log(results);
            }, null);
        });
    },
    runSetup: function () {
        var windowWidth = window.innerWidth;
        var windowHeight = window.innerHeight;

        $('#intro').css('width', windowWidth-60).css('height', windowHeight-60);

        // $( document ).on("pagecreate", "#menu", function () {
        $('body').pagecontainer( "change", "#setup", { role: "page", transaction: "fade" } );
        // });

        $('.scrollDown').on('click', function (e) {
            e.preventDefault();
            window.scrollTo( 0, document.body.scrollHeight);
        });

        $('a.saveSetup').unbind('click').on('click', function (e) {
            e.preventDefault();
            var error = 0;

            var gender, metrics, age, height, weight, name;
            name = $('#setupName').val();
            if ( !name )
            {
                $('#setupName').closest('.form-group').addClass('error');
                error++;
            }

            age = $('#setupAge').val();
            if ( !age )
            {
                $('#setupAge').closest('.form-group').addClass('error');
                error++;
            }

            height = $('#setupHeight').val();
            if ( !height )
            {
                $('#setupHeight').closest('.form-group').addClass('error');
                error++;
            }

            weight = $('#setupWeight').val();
            if ( !weight )
            {
                $('#setupWeight').closest('.form-group').addClass('error');
                error++;
            }


            if ( error > 0 )
                return false;

            BMI.localStorage.setItem('name', name);
            
            gender = $('#setupGender').val();
            BMI.localStorage.setItem('gender', gender);

            metrics = $('#setupMetrics').val();
            BMI.localStorage.setItem('metrics', metrics);

            age = $('#setupAge').val();
            BMI.localStorage.setItem('age', age);

            height = $('#setupHeight').val();
            BMI.localStorage.setItem('height', height);

            weight = $('#setupWeight').val();
            BMI.localStorage.setItem('weight', weight);

            var bmi, bmr, today = BMI.getToday();
            
            if ( metrics == 1)
            {
                bmi = BMI.calculateBMIImperial(true);
                bmr = BMI.calculateBMRImperial(true);
            }
            else
            {
                bmi = BMI.calculateBMIMetric(true);
                bmr = BMI.calculateBMRMetric(true);
            }

            BMI.localStorage.setItem('currentWeightDate', today);
            BMI.localStorage.setItem('currentBMIDate', today);
            BMI.localStorage.setItem('currentBMRDate', today);

            BMI.firstrun = false;
            $('#menu #name').text(BMI.localStorage.getItem('name'));
            BMI.localStorage.setItem('firstrun', true);
            $('body').pagecontainer( "change", "#menu", { role: "page", transaction: "fade" } );
        });
    },
    addScrollbar: function () {
        // 50 + 35.5 + 35
        $('[ui-panel]').css('height', (window.innerHeight-50-35-35.5));
    },
    getAllData: function (callback) {
        BMI.openDB();
        BMI.chartData = []; // reset chartdata for re-population
        BMI.bmiDB.transaction(function(transaction) {
            transaction.executeSql('SELECT * FROM history ORDER by id DESC', [], function (tx, results) {
                var len = results.rows.length, i;
                

                if ( len > 0 )
                {
                    $("#dataCount h3 span").text(len);
                    $('.hidden').each(function () {
                        $(this).removeClass('hidden');
                    });
                    BMI.localStorage.setItem('hasResults', true);
                }
                else
                    BMI.localStorage.setItem('hasResults', false);

                // CLear results LIST
                $("#result_rows").empty();
                for (i = 0; i < len; i++) {
                    var weightMetric = 0;
                    if ( results.rows.item(i).metrics == 1 )
                        weightMetric = 'Lbs';
                    else
                        weightMetric = 'Kg';

                    var weight = results.rows.item(i).weight + '' + weightMetric;

                    BMI.chartData.push(results.rows.item(i).weight);
                    
                    var html = '<div class="media"><div class="media-left"><span>' + results.rows.item(i).date + '</span></div><div class="media-body"><h4>' + results.rows.item(i).test + '</h4><span>Weight '+weight+'</span></div><div class="media-right"><span>' + results.rows.item(i).result + '</span></div></div>';
                    $("#result_rows").append("<li>"+ html + "</li>");
                }
                callback();
            }, null);
        });
    },
    generateCharts: function () {
        if ( !$('div#dataViewChart') )
            return false;

        var width = window.innerWidth - 30;

        $('div#dataViewChart').css('width', width).css('height', (width-130) );

        var chart = c3.generate({
            bindto: '#dataViewChart',
            data: {
                columns: [
                    BMI.chartData.reverse()
                ]
            },
            grid: {
                x: {
                    show: true
                },
                y: {
                    show: true
                }
            },
            padding: {
                top: 0,
                right: 0,
                bottom: 0,
                left: 40,
            },
            legend: {
                show: false
            }
        });
        // setTimeout(function () {
        //     chart.load( { 
        //         columns: [ 
        //             BMI.chartData.reverse()
        //         ] 
        //     });
        // }, 500);
    },
    openDB: function () {
        if ( !BMI.save )
            return false;
        
        // BMI.bmiDB = window.sqlitePlugin.openDatabase({name: "BMICalc.db", location: 'default'});
        BMI.bmiDB = window.openDatabase("BMITracker.db", "1.0", "BMI Tracker DB", 3 * 1024 * 1024);
        BMI.bmiDB.transaction(function(transaction) {
            // test, result, gender, metrics, weight, date
            transaction.executeSql('CREATE TABLE IF NOT EXISTS history (id integer primary key, test text, weight integer, metrics integer, gender integer, result float, date text)', [],
            function(tx, result) {
                // console.log("Table created successfully");
            },
            function(error) {
                console.log("Error occurred while creating the table.");
            });

        });
    },
    updateLocalValue: function (key, value) {
        if ( !key )
            return false;
        if ( !value )
            return false;


        if ( !BMI.localStorage.getItem(key) )
            BMI.localStorage.setItem(key, value);
        else {
            var last = BMI.localStorage.getItem(key);
            BMI.localStorage.setItem('last_' + key, last);
            BMI.localStorage.setItem(key, value);
        }
    },
    calculateBFP: function () {
        var bfp     = null;
        var weight  = $('[name="bfp_weight"]').val();
        var height  = $('[name="bfp_height"]').val();
        var waist   = $('[name="bfp_waist"]').val();
        var neck    = $('[name="bfp_neck"]').val();
        var hip     = $('[name="bfp_hip"]').val();

        if ( BMI.metrics == 1) {
            height = height * 2.54;
            neck = neck * 2.54;
            waist = waist * 2.54;
            hip = hip * 2.54;
            weight = weight * 0.4536;
            bfp = 495 / (1.29579 - 0.35004 * (BMI.logten(waist + hip - neck)) + 0.221 * (BMI.logten(height))) - 450;
        }
        else
            bfp = 495 / (1.0324 - 0.19077 * (BMI.logten(waist - neck)) + 0.15456 * (BMI.logten(height))) - 450;
            
        bfp = (Math.round(bfp*10))/10;
        
        $('#bfp-result').text(bfp.toFixed(1) + '%');
        BMI.storeData(bfp.toFixed(1) + '%', "BFP Test");
        return bfp;
    },
    calculateWTHR: function () {
        var wthr     = null;
        var height  = $('[name="wthr_height"]').val();
        var waist   = $('[name="wthr_waist"]').val();
        
        wthr = waist/height;

        $('#wthr-result').text(wthr.toFixed(2));
        BMI.storeData(wthr.toFixed(2), "WtHR Test");
        return wthr;
    },
    logten: function(v){
        return (Math.log(v)/Math.log(10));
    },
    calculateBMIImperial: function (local) {
        // BMI = ( Weight in Pounds / ( Height in inches x Height in inches ) ) x 703
        var height, weight;
        if ( local )
        {
            height = BMI.localStorage.getItem('height');
            weight = BMI.localStorage.getItem('weight');
        } else {
            height = $('[name="bmi_height"]').val();
            weight = $('[name="bmi_weight"]').val();
        }
        
        height = height*height;
        var bmi = (weight / height) * 703;
        
        if ( local )
            $('#currentBMI').text(bmi.toFixed(1));
        else
        {
            $('#bmi-result').text(bmi.toFixed(1));
            BMI.localStorage.setItem('weight', weight);
            BMI.localStorage.setItem('height', height);
        }
        
        BMI.localStorage.setItem('bmi', bmi);
        BMI.storeData(bmi.toFixed(1), "BMI Test");
        return bmi;
    },
    calculateBMIMetric: function (local) {
        // BMI = ( Weight in Kilograms / ( Height in Meters x Height in Meters ) )
        var height, weight;
        if ( local )
        {
            height = BMI.localStorage.getItem('height');
            weight = BMI.localStorage.getItem('weight');
        } else {
            height = $('[name="bmi_height"]').val();
            weight = $('[name="bmi_weight"]').val();
        }

        height = height/100; // so we got meters not cm
        height = height*height;
        var bmi = weight / height;
        
        if ( local )
            $('#currentBMI').text(bmi.toFixed(1));
        else
        {
            $('#bmi-result').text(bmi.toFixed(1));
            BMI.localStorage.setItem('weight', weight);
            BMI.localStorage.setItem('height', height);
        }
        BMI.localStorage.setItem('bmi', bmi.toFixed(1));
        BMI.storeData(bmi.toFixed(1), "BMI Test");
        return bmi;
    },
    calculateBMRImperial: function () {
        // BMR Female =  655 + ( 4.35 x weight in pounds ) + ( 4.7 x height in inches ) - ( 4.7 x age in years )
        // BMR Men = 66 + ( 6.23 x weight in pounds ) + ( 12.7 x height in inches ) - ( 6.8 x age in year )
        var age = $('[name="bmr_age"]').val();
        var height = $('[name="bmr_height"]').val();
        var weight = $('[name="bmr_weight"]').val();

        var bmr = null;
        if ( BMI.gender == 1 )
            bmr = 655 + ( 4.35 * weight ) + ( 4.7 * height ) - ( 4.7 * age );
        else
            bmr = 66 + ( 6.23 * weight ) + ( 12.7 * height ) - ( 6.8 * age );

        $('#bmr-result').text(bmr.toFixed(1));
        BMI.localStorage.setItem('bmr', bmr.toFixed(1));
        BMI.storeData(bmr.toFixed(1), "BMR Test");
        return bmr;
    },
    calculateBMRMetric: function () {
        // BMR Female = 655 + ( 9.6 x weight in kilos ) + ( 1.8 x height in cm ) - ( 4.7 x age in years )
        // BMR Men = 66 + ( 13.7 x weight in kilos ) + ( 5 x height in cm ) - ( 6.8 x age in years )
        var age = $('[name="bmr_age"]').val();
        var height = $('[name="bmr_height"]').val();
        var weight = $('[name="bmr_weight"]').val();

        var bmr = null;
        if ( BMI.gender == 1 )
            bmr = 655 + ( 9.6 * weight ) + ( 1.8 * height ) - ( 4.7 * age );
        else
            bmr = 66 + ( 13.7 * weight ) + ( 5 * height ) - ( 6.8 * age );

        $('#bmr-result').text(bmr.toFixed(1));
        BMI.localStorage.setItem('bmr', bmr.toFixed(1));
        BMI.storeData(bmr.toFixed(1), "BMI Test");
        return bmr;
    },
    calculateEnergyExpanditure: function (bmr) {
        var activity = $('#activity').val();
        var energyExpanditure = null;
        
        switch ( activity )
        {
            case '1': energyExpanditure = (bmr * 1.2); break;
            case '2': energyExpanditure = (bmr * 1.375); break;
            case '3': energyExpanditure = (bmr * 1.55); break;
            case '4': energyExpanditure = (bmr * 1.725); break;
            case '5': energyExpanditure = (bmr * 1.9); break;
        }

        $('#energyExpanditure').text(energyExpanditure.toFixed(1));
        // return energyExpanditure;
    },
    positionArrow: function (bmi) {
        if ( bmi < 16 )
            BMI.resCol = 0;
        if ( bmi > 16 && bmi < 16.9 )
            BMI.resCol = 1;
        if ( bmi > 17 && bmi < 18.4 )
            BMI.resCol = 2;
        if ( bmi > 18.5 && bmi < 24.9 )
            BMI.resCol = 3;
        if ( bmi > 25 && bmi < 29.9 )
            BMI.resCol = 4;
        if ( bmi > 30 && bmi < 39.9 )
            BMI.resCol = 5;
        if ( bmi >= 40 )
            BMI.resCol = 6;
        
        var col = $('div.col.' + BMI.results[BMI.resCol]);
        var a = col.offset();
        var colInnerWidth = col.innerWidth();
        var arrowOffset = a.left + (colInnerWidth/2);
        $('#calculate #bmi div.arrow div,#calculate #bmi div.arrow2 div').css('left', arrowOffset.toFixed(2) + 'px');
    },
    positionArrowBFP: function (bfp) {
        if ( BMI.gender == 1 )
        {
            if ( bfp > 10 && bfp < 12 )
                BMI.resCol = 0;
            if ( bfp > 14 && bfp < 20 )
                BMI.resCol = 1;
            if ( bfp > 21 && bfp < 24 )
                BMI.resCol = 2;
            if ( bfp > 25 && bfp < 31 )
                BMI.resCol = 3;
            if ( bfp >= 32 )
                BMI.resCol = 4;
        }
        else
        {
            if ( bfp > 2 && bfp < 4 )
                BMI.resCol = 0;
            if ( bfp > 6 && bfp < 13 )
                BMI.resCol = 1;
            if ( bfp > 14 &&bfp < 17 )
                BMI.resCol = 2;
            if ( bfp > 18 && bfp < 25 )
                BMI.resCol = 3;
            if ( bfp >= 26 )
                BMI.resCol = 4;
        }
        
        
        var col = $('div.col2.' + BMI.results2[BMI.resCol]);
        var a = col.offset();
        var colInnerWidth = col.innerWidth();
        var arrowOffset = a.left + (colInnerWidth/2);
        $('#calculate #bfp div.arrow div,#calculate #bfp div.arrow2 div').css('left', arrowOffset.toFixed(2) + 'px');
    },
    positionArrowWTHR: function (wthr) {
        if ( BMI.gender == 1 )
        {
            if ( wthr < 0.34 )
                BMI.resCol = 0;
            if ( wthr > 0.35 && wthr < 0.41 )
                BMI.resCol = 1;
            if ( wthr > 0.42 && wthr < 0.48 )
                BMI.resCol = 2;
            if ( wthr > 0.49 && wthr < 0.53 )
                BMI.resCol = 3;
            if ( wthr > 0.54 && wthr < 0.57 )
                BMI.resCol = 4;
            if ( wthr >= 0.58 )
                BMI.resCol = 5;
        }
        else
        {
            if ( wthr < 0.34 )
                BMI.resCol = 0;
            if ( wthr > 0.35 && wthr < 0.42 )
                BMI.resCol = 1;
            if ( wthr > 0.43 && wthr < 0.52 )
                BMI.resCol = 2;
            if ( wthr > 0.53 && wthr < 0.57 )
                BMI.resCol = 3;
            if ( wthr > 0.58 && wthr < 0.62 )
                BMI.resCol = 4;
            if ( wthr >= 0.63 )
                BMI.resCol = 5;
        }
        
        
        var col = $('div.col3.' + BMI.results3[BMI.resCol]);
        var a = col.offset();
        var colInnerWidth = col.innerWidth();
        var arrowOffset = a.left + (colInnerWidth/2);
        $('#calculate #wthr div.arrow div,#calculate #wthr div.arrow2 div').css('left', arrowOffset.toFixed(2) + 'px');
    },
    changeMetricLabels: function () {
        if ( BMI.metrics == 1)
        {
            $('.weight-unit').text('lbs');
            $('.height-unit').text('in');
            $('[name="bmi_weight"], [name="bmr_weight"]').attr('max', '355');
        } 
        else 
        {
            $('.weight-unit').text('kg');
            $('.height-unit').text('cm');
            $('[name="bmi_weight"], [name="bmr_weight"]').attr('max', '160');
        }
    },
    storeData: function (result, test) {
        if ( !BMI.save )
            return false;

        if ( !BMI.bmiDB )
            BMI.openDB();

        if ( !test )
            var test="BMI Test";

        if ( !result )
            var result=23.5;

        var today = BMI.getToday();

        var gender = BMI.localStorage.getItem('gender');
        var metrics = BMI.localStorage.getItem('metrics');
        // var age = $('[data-age]').val();
        // var weight = $('[data-weight]').val();
        // var height = $('[data-height]').val();
        var weight = BMI.localStorage.getItem('weight');
        var age = BMI.localStorage.getItem('age');
        var height = BMI.localStorage.getItem('height');
        var waist = $('[data-waist]').val();
        var neck = $('[data-neck]').val();
        var hip = $('[data-hip]').val();
        var activity = $('[data-activity]').val();

        BMI.localStorage.setItem('gender', gender);
        BMI.localStorage.setItem('metrics', metrics);
        
        if ( weight)
            BMI.localStorage.setItem('weight', weight);
        if ( age )
            BMI.localStorage.setItem('age', age);
        if ( height )
            BMI.localStorage.setItem('height', height);
        if ( waist )
            BMI.localStorage.setItem('waist', waist);
        if ( neck )
            BMI.localStorage.setItem('neck', neck);
        if ( hip )
            BMI.localStorage.setItem('hip', hip);
        if ( activity )
            BMI.localStorage.setItem('activity', activity);


        BMI.bmiDB.transaction(function(transaction) {
            var executeQuery = "INSERT INTO history (test, result, gender, metrics, weight, date) VALUES (?,?,?,?,?,?)";
            transaction.executeSql(executeQuery, [test, result, gender, metrics, weight, today], function(tx, results) {
                // BMI.getAllData(function () {
                //     BMI.generateCharts();
                // });
            },
            function(error){
                console.log(error);
                console.log('Error occurred');
            });
        });
    },
    getToday: function () {
        var today = new Date();
        var dd = today.getDate();
        var mm = today.getMonth()+1; //January is 0!
        var yyyy = today.getFullYear();
        var hh = today.getHours();
        var minutes = today.getMinutes();

        if(dd<10) {
            dd='0'+dd
        } 

        if(mm<10) {
            mm='0'+mm
        }

        today = mm+'/'+dd+'/'+yyyy+' ' + hh + ':' + minutes;
        return today;
    },
    getLastDataFromDB: function () {
        if ( !BMI.bmiDB )
            BMI.openDB();

        BMI.bmiDB.transaction(function(transaction) {
            transaction.executeSql('SELECT * FROM history ORDER by id DESC LIMIT 1', [], function (tx, results) {
                $("#last-test").text(results.rows.item(0).test);
                $("#last-date").text(results.rows.item(0).date);
            }, null);
        });
    }
};

BMI.init();