var admobid = admobid || {};

// TODO: replace the following ad units with your own
if( /(android)/i.test(navigator.userAgent) ) { 
    admobid = { // for Android
        banner: 'ca-app-pub-4100671534283974/6468566447',
        interstitial: 'ca-app-pub-4100671534283974/7945299646'
    };
} else if(/(ipod|iphone|ipad)/i.test(navigator.userAgent)) {
    admobid = { // for iOS
        banner: 'ca-app-pub-4100671534283974/6468566447',
        interstitial: 'ca-app-pub-4100671534283974/7945299646'
    };
} else {
    admobid = { // for Windows Phone
        banner: 'ca-app-pub-4100671534283974/6468566447',
        interstitial: 'ca-app-pub-4100671534283974/7945299646'
    };
}

var admobfunc = admobfunc || {};
admobfunc = {
    init: function () {
        if (! AdMob ) { alert( 'admob plugin not ready' ); return; }

        // this will create a banner on startup
        AdMob.createBanner( {
            adId: admobid.banner,
            position: AdMob.AD_POSITION.BOTTOM_CENTER,
            isTesting: true, // TODO: remove this line when release
            overlap: false,
            offsetTopBar: false,
            bgColor: 'black'
        } );

        // this will load a full screen ad on startup
        // AdMob.prepareInterstitial({
        //     adId: admobid.interstitial,
        //     isTesting: true, // TODO: remove this line when release
        //     autoShow: true
        // });
    }
}