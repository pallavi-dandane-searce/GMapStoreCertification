angular.module('gMapStoreLocator').controller('mapController', function ($scope, $timeout) {
    /**
     * radius of distance in Km to search for nearest stores
     * @type {number}
     */
    $scope.radius = 5;

    /**
     * Flag to show/hode directions panel
     * @type {{showList: boolean}}
     */
    $scope.directionsPanel = {
        showList: false
    };

    /**
     * Array to store the stores data from db
     * @type {Array}
     */
    $scope.storesData = [];

    /**
     * user selected location
     * @type {{userAddress: {}}[]}
     */
    $scope.wayPoints = [
        {'userAddress': {}}
    ];

    $scope.userAddressautoComplete;

    /**
     * map object
     */
    var map;

    /**
     * arrays to store markers, infowindows etc.
     * used to set /reset those on map as per need
     */
    var myLatLng, arrMarkers = [], arrUserMarkers = [], arrInfowindows = [], arrpolylines = [], arrdirectionsDisplay = [], arrdirectionsService = [];

    /**
     * flag to decide already placed markers/directions/infowindows to clear or not while placing others
     * @type {boolean}
     */
    var flgShowAllMarkers = true;

    /**
     *
     */
    var directionsDisplay, directionsService;

    /**
     * To initaliza the map
     */
    $scope.initMap = function () {
        myLatLng = new google.maps.LatLng(18.580085, -73.738125);

        // Instantiate a directions service.
        directionsService = new google.maps.DirectionsService();
        directionsDisplay = new google.maps.DirectionsRenderer();

        map = new google.maps.Map(document.getElementById('mymap'), {
            center: myLatLng,
            zoom: 5,
            streetViewControl: false,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        });
        directionsDisplay.setMap(map);

//        set center of map to geolocation of user
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function (position) {
                var pos = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                map.setCenter(pos);
            }, function () {
//                if error occurs set center to default
                map.setCenter(new google.maps.LatLng(28.7041, 77.1025));
            });
        }

//        click event to add functionality to select user location on map and place nearest locations
        google.maps.event.addListener(map, 'click', function (event) {
//            geocode the selected user location
            var geocoder = geocoder = new google.maps.Geocoder();
            geocoder.geocode({ 'latLng': event.latLng }, function (results, status) {
                if (status == google.maps.GeocoderStatus.OK) {

                    $scope.wayPoints[0].userAddress = results[0];
                    // Create the PlaceService and send the request.
                    var service = new google.maps.places.PlacesService(map);
                    // Create and send the request to obtain details for a specific place,
                    // using its Place ID.
                    var request = {
                        placeId:  results[0].place_id
                    };

                    service.getDetails(request, function (place, status) {
                        if (status == google.maps.places.PlacesServiceStatus.OK) {
                            $scope.userAddressautoComplete =  results[0];
                        }
                    });
//                    $scope.userAddressautoComplete =  results[0];
//                  set user marker
                    setUserMarker(event.latLng);
//                  get nearby stores
                    $scope.placeNearestLocations();
                }
            });
        });
//      Get all stores
        $scope.getStores();
    };

    /**
     * set user marker
     * @param markerPosition
     */
    function setUserMarker(markerPosition) {
        console.log($scope.wayPoints[0].userAddress);

        var pinImage = new google.maps.MarkerImage("images/icon/home-2.png");

        var marker = new google.maps.Marker({
            position: markerPosition,
            icon: pinImage,
            map: map
        });
        for (i = 0; i < arrUserMarkers.length; i++) {
            arrUserMarkers[i].setMap(null);
        }
        arrUserMarkers = [];
        arrUserMarkers.push(marker);
    }

    /**
     * Get all stores from DB
     */
    $scope.getStores = function () {
        $.getJSON('/stores', function (data) {
            $scope.storesData = data;
            map.setCenter(new google.maps.LatLng($scope.storesData[0].lat, $scope.storesData[0].lng));
            map.setZoom(11);
            $scope.$apply();
            $scope.placeMarkesrs(data);
        });
    };

    /**
     * calulate the distance between the 2 points given
     * @param lat1
     * @param lng1
     * @param lat2
     * @param lng2
     * @returns {number}
     */
    function distance(lat1, lng1, lat2, lng2) {
        var radlat1 = Math.PI * lat1 / 180;
        var radlat2 = Math.PI * lat2 / 180;
        var radlon1 = Math.PI * lng1 / 180;
        var radlon2 = Math.PI * lng2 / 180;
        var theta = lng1 - lng2;
        var radtheta = Math.PI * theta / 180;
        var dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
        dist = Math.acos(dist);
        dist = dist * 180 / Math.PI;
        dist = dist * 60 * 1.1515;

        //Get in in kilometers
        dist = dist * 1.609344;

        return dist;
    }

    /**
     * place given markers on map
     * @param data
     */
    $scope.placeMarkesrs = function (data) {
        if (flgShowAllMarkers == false) {
            for (i = 0; i < arrMarkers.length; i++) {
                arrMarkers[i].setMap(null);
            }
            arrMarkers = [];

            if (arrdirectionsDisplay != null) {
                for (i = 0; i < arrdirectionsDisplay.length; i++) {
                    arrdirectionsDisplay[i].setMap(null);
                    arrdirectionsDisplay[i] = null;
                }
                arrdirectionsDisplay = [];
            }
        }
        if (data != null) {

            $.each(data, function (index, item) {
                myLatLng = new google.maps.LatLng(parseFloat(this.lat), parseFloat(this.lng));
                var infoWindowContent = "";
                var markerImage = 'images/icon/' + (this.markerColor ? this.markerColor : 'red') + '.png';


                infoWindowContent = '<div id="content"  class="infowindow_store">' +
                    '<img src="' + this['icon'] + '">' +
                    '<label style="color: orangered;" >' + this['s_name'] + '</label> <br>' +
                    '<label style="color: dodgerblue;">' + this['s_address'] + '</label> <br>' +
                    '<label style="color: darkmagenta;">' + this['s_rating'] + '</label> <br>' +
                    '</div>';


                var marker = new google.maps.Marker({
                    position: myLatLng, map: map,
                    icon: markerImage// 'http://maps.google.com/mapfiles/ms/icons/' + (this.markerColor?this.markerColor:'red') + '-dot.png'
                });
                marker.setMap(map);

                var infoWindow = new google.maps.InfoWindow({
                    content: infoWindowContent
                });
                marker.addListener('click', function (e) {
                    for (i = 0; i < arrInfowindows.length; i++) {
                        arrInfowindows[i].close();
                    }
                    arrInfowindows = [];
                    infoWindow.open(map, marker);
                    arrInfowindows.push(infoWindow);
                    if ($scope.wayPoints[0].userAddress.geometry == undefined) {
                        alert("Please select user location first to view directions.");
                        return;
                    }
//                  display route on marker click
                    showDirections($scope.wayPoints[0].userAddress.geometry.location, e.latLng);
                });
                arrMarkers.push(marker);
            });
        }
    };

    /**
     * serach and place nearby stores
     */
    $scope.placeNearestLocations = function () {
        if ($scope.wayPoints[0].userAddress.geometry == undefined) {
            alert("Please select user location first to view directions.");
            return;
        }
        var dist = 0;
        var nearestMarkers = [];
        var flightPath, infoWindow, marker_lat_lng, distance_from_location;
        for (i = 0; i < arrInfowindows.length; i++) {
            arrInfowindows[i].close();
        }
        arrInfowindows = [];
//        clear all polylines
        for (i = 0; i < arrpolylines.length; i++) {
            arrpolylines[i].setMap(null);
        }
        arrpolylines = [];

        // calculate distance of each store from user location and put only stores which fall in radius selected
        for (var i = 0; i < $scope.storesData.length; i++) {

            marker_lat_lng = new google.maps.LatLng($scope.storesData[i].lat, $scope.storesData[i].lng);
            //distance in meters between your location and the marker
            distance_from_location = google.maps.geometry.spherical.computeDistanceBetween($scope.wayPoints[0].userAddress.geometry.location, marker_lat_lng);
//            convert distance in km
            distance_from_location = distance_from_location / 1000;

            $scope.storesData[i].distanceFromUserLocation = distance_from_location;
//          check if distance in within radius
            if (distance_from_location <= parseInt($scope.radius)) {

                flightPath = new google.maps.Polyline({
                    path: [
                        marker_lat_lng,
                        $scope.wayPoints[0].userAddress.geometry.location
                    ],
                    geodesic: true,
                    strokeColor: 'gray',
                    strokeOpacity: 1.0,
                    strokeWeight: 1
                });

                flightPath.setMap(map);
                arrpolylines.push(flightPath);
                infoWindow = new google.maps.InfoWindow({
                    content: distance_from_location.toFixed(2) + " km"
                });
                var pos = google.maps.geometry.spherical.interpolate(marker_lat_lng, $scope.wayPoints[0].userAddress.geometry.location, 0.5);
                infoWindow.setPosition(pos);
                infoWindow.open(map);
                arrInfowindows.push(infoWindow);
                nearestMarkers.push($scope.storesData[i]);
            }
        }
        flgShowAllMarkers = false;
        setUserMarker($scope.wayPoints[0].userAddress.geometry.location);
        $scope.placeMarkesrs(nearestMarkers);
        $scope.$apply();
    };

    /**
     * display route and distance from user location to selected store
     * @param start
     * @param end
     */
    function showDirections(start, end) {
        if (arrdirectionsDisplay != null) {
            for (i = 0; i < arrdirectionsDisplay.length; i++) {
                arrdirectionsDisplay[i].setMap(null);
                arrdirectionsDisplay[i] = null;
            }
            arrdirectionsDisplay = [];
        }

        var infowindow2 = new google.maps.InfoWindow();
        var request = {
            origin: start,
            destination: end,
            travelMode: google.maps.TravelMode.DRIVING
        };


        directionsService.route(request, function (response, status) {
            if (status == google.maps.DirectionsStatus.OK) {
                var directionsDisplay = new google.maps.DirectionsRenderer(
                    {
                        suppressMarkers: true
                    }
                );
                directionsDisplay.setMap(map);
                directionsDisplay.setOptions({ preserveViewport: true });
                directionsDisplay.setDirections(response);
                arrdirectionsDisplay.push(directionsDisplay);
                directionsDisplay.setPanel(document.getElementById('directionsList'));

                $scope.directionsPanel.showList = true;
                $scope.$apply();

                infowindow2.setContent(response.routes[0].legs[0].distance.text + "<br>" + response.routes[0].legs[0].duration.text + " ");
                if (response.routes) {
                    if (response.routes[0].overview_path) {
                        var index = parseInt(response.routes[0].overview_path.length / 2);
                        var infoposition = new google.maps.LatLng(response.routes[0].overview_path[index].lat(), response.routes[0].overview_path[index].lng());
                    }
                }
                infowindow2.setPosition(infoposition ? infoposition : end);
                infowindow2.open(map);
                arrInfowindows.push(infowindow2);

            }
        });
    }

    //////////////////////////////////////Default function calling on load////////////////////////////////
    setTimeout(function () {
        $scope.initMap();
    }, 100);
});

/**
 * directive to create google autocomplete with custom requirments
 */
angular.module('gMapStoreLocator').directive('googleplace', function () {
    var markers = [];
    return {
        require: 'ngModel',
        scope: true,
        link: function ($scope, element) {
            setTimeout(function () {
                var autocomplete = new google.maps.places.Autocomplete(element[0]);
                google.maps.event.addListener(autocomplete, 'place_changed', function () {
                    $scope.wayPoints[0].userAddress = autocomplete.getPlace();
                    console.log($scope.wayPoints[0].userAddress);


                });
            }, 150);

            $scope.$watch('userAddressautoComplete', function(userAddressautoComplete) {
                $("src").val(userAddressautoComplete);
                $scope.$apply();
            })
        }
    };
});