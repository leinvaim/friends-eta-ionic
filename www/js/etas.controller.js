(function() {

'use strict';
angular
    .module('friendsEta')
    .controller('EtasController', EtasController);

/* @ngInject */
function EtasController ($http, ENV) {
    /* jshint validthis: true */
    var vm = this;

    vm.activate = activate;
    vm.title = 'Etas';

    activate();



    function activate() {

        window.navigator.geolocation.getCurrentPosition(function(location) {
            console.log(location);
        });
        if(window.BackgroundGeolocation){
            var bgGeo = window.BackgroundGeolocation;
            /**
             * This would be your own callback for Ajax-requests after POSTing background geolocation to your server.
             */
            var yourAjaxCallback = function(response) {
                ////
                // IMPORTANT:  You must execute the #finish method here to inform the native plugin that you're finished,
                //  and the background-task may be completed.  You must do this regardless if your HTTP request is successful or not.
                // IF YOU DON'T, ios will CRASH YOUR APP for spending too much time in the background.
                //
                //
                bgGeo.finish();
            };

            /**
             * This callback will be executed every time a geolocation is recorded in the background.
             */
            var callbackFn = function(location) {
                console.log('[js] BackgroundGeoLocation callback:  ' + location.latitude + ',' + location.longitude);
                // Do your HTTP request here to POST location to your server.
                //
                //
                yourAjaxCallback.call(this);
            };

            var failureFn = function(error) {
                console.log('BackgroundGeoLocation error');
            }

            // BackgroundGeoLocation is highly configurable.
            bgGeo.configure(callbackFn, failureFn, {
                url: 'http://only.for.android.com/update_location.json', // <-- Android ONLY:  your server url to send locations to
                params: {
                    auth_token: 'user_secret_auth_token',    //  <-- Android ONLY:  HTTP POST params sent to your server when persisting locations.
                    foo: 'bar'                              //  <-- Android ONLY:  HTTP POST params sent to your server when persisting locations.
                },
                headers: {                                   // <-- Android ONLY:  Optional HTTP headers sent to your configured #url when persisting locations
                    "X-Foo": "BAR"
                },
                desiredAccuracy: 10,
                stationaryRadius: 20,
                distanceFilter: 30,
                notificationTitle: 'Background tracking', // <-- android only, customize the title of the notification
                notificationText: 'ENABLED', // <-- android only, customize the text of the notification
                activityType: 'AutomotiveNavigation',
                debug: true, // <-- enable this hear sounds for background-geolocation life-cycle.
                stopOnTerminate: false // <-- enable this to clear background location settings when the app terminates
            });

            // Turn ON the background-geolocation system.  The user will be tracked whenever they suspend the app.
            bgGeo.start();

            // If you wish to turn OFF background-tracking, call the #stop method.
            // bgGeo.stop()


        }



        $http.get(ENV.apiEndpoint + 'users').then(function(response) {
            vm.friends = response.data;
            $http.post(ENV.apiEndpoint + 'locations', {'user_id': 1, 'lat': -27.471011, 'long': 153.023449}).then(function(){
                $http.get(ENV.apiEndpoint + 'users/1/etas').then(function(response){
                    vm.etas = response.data;
                    console.log(vm.etas);
                    vm.friends = _.map(vm.friends, function(friend){
                        friend.eta = _.find(vm.etas, {user_id: friend.id});
                        return friend;
                    });
                    console.log(vm.friends);
                });
            });
        });




    }
}

})();