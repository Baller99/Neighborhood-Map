var Place = function(data) {
    var self = this;
    self.name = ko.observable(data.name);
    self.myLat = data.myLat;
    self.myLng = data.myLng;
    self.marker = data.marker;
    self.position = data.position;
    self.address = ko.observable(data.address);
    self.rating = ko.observable();
    self.content = data.content;
    self.icon = data.icon;
    self.type = data.types;
};

var map;
var i;

//Create map
var initMap = function() {
    var wichita = new google.maps.LatLng(37.6872, -97.3301);
        var mapOptions = {
        zoom: 14,
        center: wichita,
        draggablecursur: null,
        mapTypeControl: true,

    };
    map = new google.maps.Map(document.getElementById('map-canvas'),
        mapOptions);

var appViewModel = function() {
        var self = this;
        var markers = [];
        var infoBoxes = [];
        //arrays to hold our different lists
        self.placeList = ko.observableArray([]);
        self.searchTerm = ko.observable('bar');
        self.filter = ko.observable('');
        self.rating = ko.observableArray([]);
        self.grouponList = ko.observableArray([]);
        self.isMenuVisible = ko.observable(false);
        //Set map controls
        var list = (document.getElementById('list'));
        map.controls[google.maps.ControlPosition.LEFT_CENTER].push(list);
        var input = (document.getElementById('search-input'));
        map.controls[google.maps.ControlPosition.TOP_RIGHT].push(input);
        //Here we create a searchbox that is using google places api autocomplete
        var search = (document.getElementById('search'));
        map.controls[google.maps.ControlPosition.TOP_RIGHT].push(search);
        var searchBox = new google.maps.places.SearchBox(
            (input));
        var service = new google.maps.places.PlacesService(map);
        //Set default locations on page load
        var request = {
            location: wichita,
            radius: 1000,
            query: 'bar'
        };
        service.textSearch(request, callback);
        searchListener(searchBox);

        // object in this case will not be necessary
        // e refers to click event
        self.toggleMenuVisibility = function(object, e) {
        e.preventDefault(); // prevent default click functions

        // toggle menu visibility by changing value of "isMenuVisible" observable
        if (self.isMenuVisible() === true) {
        self.isMenuVisible(false);
        } else {
        self.isMenuVisible(true);
        }
    };

        //Filters places based on inputs
        self.filteredItems = ko.computed(function() {
            var filter = this.filter().toLowerCase();
            return ko.utils.arrayFilter(self.placeList(), function(item){
                var nameFilter = item.name().toLowerCase().indexOf(filter);
                var addressFilter = item.address().toLowerCase().indexOf(filter);

            // does the location name or address contain the filter term?
            if (nameFilter !== -1 || addressFilter !== -1) {
                item.marker.setVisible(true); // hide the map marker
            } else {
                item.marker.setVisible(false); // show the map marker
            }

            var results = (nameFilter !== -1 || addressFilter !== -1);
            return results;
            });
        }, self);

        //
        self.clickMarker = function(place) {
            google.maps.event.trigger(place.marker, "click");
            //Set map center to the marker
            map.setCenter(place.position);
        };

        function stopBounce(place) {
            place.marker.setAnimation(null);
        }

        function callback(results, status) {
            var service = new google.maps.places.PlacesService(map);
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                for (var i = 0; i < results.length; i++) {
                    var place = results[i];
                    var search = {
                        placeId: place.place_id
                    };
                    service.getDetails(search, callbackDetails);
                }
            }
        }

        //Get details on places 
        function callbackDetails(place, status) {
            if (status == google.maps.places.PlacesServiceStatus.OK) {
                place.address = place.formatted_address;
                place.phone = place.formatted_phone_number;
                place.position = place.geometry.location;
                if (place.reviews) {
                    place.review = place.reviews[0].text;
                }
                place.content = '<p>' + place.name + '</p><p>' + place.phone + '</p><p>' + place.address + '</p><p> Foursquare Rating: ' + place.rating + '</p><p>' + place.review + '</p>';
                place.icon = 'http://maps.google.com/mapfiles/kml/paddle/blu-diamond.png';
                place.marker = createSearchMarker(place);
                self.placeList.push(new Place(place));
                markerListener(place);
            }
        }
        //Create markers
        function createSearchMarker(place) {
            var marker = new google.maps.Marker({
                map: map,
                position: place.position,
                animation: google.maps.Animation.DROP,
                icon: place.icon
            });
            marker.setVisible(false);
            markers.push(marker);
            return marker;

        }
        //Open InfoWindow
        function markerListener(place) {
            google.maps.event.addListener(place.marker, 'click', function() {
                closeAllBoxes();
                var infowindow = new google.maps.InfoWindow({
                    content: place.content,
                });
                infoBoxes.push(infowindow);
                infowindow.open(map, this);
                setTimeout(function() {
                    infowindow.close();
                }, 10000);
                //Animate marker
                place.marker.setAnimation(google.maps.Animation.BOUNCE);
                setTimeout(function() {stopBounce(place);}, 2000);
            });
        }
        //Google places search
        function searchListener(searchBox) {
            var service = new google.maps.places.PlacesService(map);

            google.maps.event.addListener(searchBox, 'places_changed', function() {
                var bounds = map.getBounds();
                var input = $('#search-input').val();
                var request = {
                    location: wichita,
                    radius: 1000,
                    query: input
                };
                removeMarkers(self.placeList);
                self.placeList.removeAll();
                service.textSearch(request, callback);
                map.fitBounds(bounds);
                map.setZoom(14);
            });
            google.maps.event.addListener(map, 'bounds_changed', function() {
                var bounds = map.getBounds();
                searchBox.setBounds(bounds);
            });
        }

        // This function is to load address from Foursquare and then display it in windows info.
    function generateInfo(marker, name, myLat, myLng) {
        var foursquareUrl = "";
        var location = [];

        foursquareUrl = 'https://api.foursquare.com/v2/venues/search' +
            '?client_id=2BIWS0KFSP1W12ARXFHNA20WHNGY0NMOAD3AFYM1ZGCFCF32' +
            '&client_secret=I2F4TTJ0HJOIAO2GCPP0T2NJBMMHFVMCLAQ4HIHF5U1JZCNG' +
            '&v=20130815' +
            '&m=foursquare' +
            '&ll=' + myLat + ',' + myLng +
            '&query=' + name +
            '&intent=match';

        //This segment handles generic ajax error
        $.ajaxSetup({
            "error": function() {
                alert("error");
            }
        });

        $.ajax({
            url: foursquareUrl,
            dataType: "jsonp",
            // jsonp: "callback",
            success: function(response, place) {
                    for (var i = 0; i < 1; i++) {
                        //Push the photo to the array created at the very beginning
                        place.content.push(response.data[i]);
                    }
                }
        });

    }

        function closeAllBoxes() {
            //close all InfoWindows on map
            for (var i = 0; i < infoBoxes.length; i++) {
                infoBoxes[i].close();
            }
        }

        function removeMarkers(list) {
            //Hide's all markers in list
            for (var i = 0; i < list().length; i++) {
                var marker = list()[i].marker;
                marker.setVisible(false);
            }
        }
    };
   ko.applyBindings(new appViewModel());
};