(function() {

'use strict';
angular
    .module('friendsEta')
    .controller('EtasController', EtasController);

/* @ngInject */
function EtasController ($http, ENV, $ionicPlatform, $scope, $state) {
    /* jshint validthis: true */
    var vm = this;

    vm.activate = activate;
    vm.title = 'Etas';
    vm.doRefresh = doRefresh;

    var userId=1;

    activate();

    ////////

    function activate() {
        if(window.localStorage['userId']){
            userId = window.localStorage['userId'];
        }
        else{
            $state.go('tab.account');
        }
        console.log(window.BackgroundGeolocation);
       if(window.BackgroundGeolocation) {
            // Get a reference to the plugin.
            var bgGeo = window.BackgroundGeolocation;

            /**
             * This callback will be executed every time a geolocation is recorded in the background.
             */
            var callbackFn = function(location, taskId) {
                console.log('getting coordinate');
                var coords = location.coords;
                var lat    = coords.latitude;
                var long    = coords.longitude;
                $http.post(ENV.apiEndpoint + 'locations', {'user_id': userId, 'lat': lat, 'long': long});
                //console.log(coords);
                // Simulate doing some extra work with a bogus setTimeout.  This could perhaps be an Ajax request to your server.
                // The point here is that you must execute bgGeo.finish after all asynchronous operations within the callback are complete.
                setTimeout(function() {
                    bgGeo.finish(taskId); // <-- execute #finish when your work in callbackFn is complete
                }, 1000);
            };

            var failureFn = function(error) {
                console.log('BackgroundGeoLocation error');
            }

            // BackgroundGeoLocation is highly configurable.
            bgGeo.configure(callbackFn, failureFn, {
                // Geolocation config
                desiredAccuracy: 0,
                stationaryRadius: 50,
                distanceFilter: 50,
                disableElasticity: false, // <-- [iOS] Default is 'false'.  Set true to disable speed-based distanceFilter elasticity
                locationUpdateInterval: 5000,
                minimumActivityRecognitionConfidence: 80,   // 0-100%.  Minimum activity-confidence for a state-change
                fastestLocationUpdateInterval: 5000,
                activityRecognitionInterval: 10000,
                stopDetectionDelay: 1,  // Wait x minutes to engage stop-detection system
                stopTimeout: 2,  // Wait x miutes to turn off location system after stop-detection
                activityType: 'AutomotiveNavigation',

                // Application config
                debug: true, // <-- enable this hear sounds for background-geolocation life-cycle.
                forceReloadOnLocationChange: false,  // <-- [Android] If the user closes the app **while location-tracking is started** , reboot app when a new location is recorded (WARNING: possibly distruptive to user)
                forceReloadOnMotionChange: false,    // <-- [Android] If the user closes the app **while location-tracking is started** , reboot app when device changes stationary-state (stationary->moving or vice-versa) --WARNING: possibly distruptive to user)
                forceReloadOnGeofence: false,        // <-- [Android] If the user closes the app **while location-tracking is started** , reboot app when a geofence crossing occurs --WARNING: possibly distruptive to user)
                stopOnTerminate: false,              // <-- [Android] Allow the background-service to run headless when user closes the app.
                startOnBoot: true,                   // <-- [Android] Auto start background-service in headless mode when device is powered-up.

                // HTTP / SQLite config
                url: 'http://posttestserver.com/post.php?dir=cordova-background-geolocation',
                method: 'POST',
                batchSync: true,       // <-- [Default: false] Set true to sync locations to server in a single HTTP request.
                autoSync: true,         // <-- [Default: true] Set true to sync each location to server as it arrives.
                maxDaysToPersist: 1,    // <-- Maximum days to persist a location in plugin's SQLite database when HTTP fails
                headers: {
                    "X-FOO": "bar"
                },
                params: {
                    "auth_token": "maybe_your_server_authenticates_via_token_YES?"
                }
            });

            // Turn ON the background-geolocation system.  The user will be tracked whenever they suspend the app.
            bgGeo.start();

            // If you wish to turn OFF background-tracking, call the #stop method.
            // bgGeo.stop()
        }



        $ionicPlatform.ready(function() {
            getEtas(userId);
        });


    }

    function getEtas(userId) {
        navigator.geolocation.getCurrentPosition(onSuccess, onError);

        function onSuccess (position) {
            var firstLat = position.coords.latitude;
            var firstLong = position.coords.longitude;
            $http.get(ENV.apiEndpoint + 'users').then(function(response) {
                vm.friends = response.data;
                $http.post(ENV.apiEndpoint + 'locations', {'user_id': userId, 'lat': firstLat, 'long': firstLong}).then(function(){
                    $http.get(ENV.apiEndpoint + 'users/'+ userId + '/etas').then(function(response){
                        vm.etas = response.data;
                        console.log(vm.etas);
                        vm.friends = _.map(vm.friends, function(friend){
                            friend.eta = _.find(vm.etas, {user_id: friend.id});
                            return friend;
                        });
                        $scope.$broadcast('scroll.refreshComplete');
                        console.log(vm.friends);
                    });
                });
            });
        }

        // onError Callback receives a PositionError object
        //
        function onError(error) {
            alert('code: '    + error.code    + '\n' +
                'message: ' + error.message + '\n');
        }
    }


    function doRefresh() {
        userId = window.localStorage['userId'];
        console.log('Refresh locations');
        getEtas(userId);
    }

}

})();