var map = new google.maps.Map(document.getElementById('map-canvas'), {
    zoom: 13,
    disableDefaultUI: true,
    center: {
        lat: 37.6872,
        lng: -97.3301
    }
});

//Set Bars as item
var Bars = function(data) {
    var self = this;
    self.name = ko.observable(data.name);
    self.photos = ko.observableArray();
    self.address = ko.observable(data.address);
    self.latLng = ko.observable(new google.maps.LatLng(data.lat, data.lng));

    //Create markers for each bar
    self.marker = new google.maps.Marker({
        map: null,
        position: self.latLng(),
        title: self.name(),
        animation: google.maps.Animation.DROP
    });

    Bars.prototype.toggleMarker = function(value) {
        if (value === map) {
            if (this.marker.map === null) {
                this.marker.setMap(map);
            }
        } else {
            this.marker.setMap(null);
        }
    };
};

//Content inside popupbox
var popupInfo = function(downtownBars) {

    return "<div id='popup'>" +
        "<h2 id='popupTitle'>" +
        downtownBars.name() + "</h2>" + downtownBars.address()
};

var appViewModel = function() {

    var self = this;
    //Create the string to be searched
    self.searchString = ko.observable('');
    
    self.infowindow = new google.maps.InfoWindow();

    //Store location in an array
    self.locations = ko.observableArray([]);
    downtownBars.forEach(function(downtownBarsInfo) {
        self.locations.push(new Bars(downtownBarsInfo));
    });

    //Filter locations
    self.filteredLocations = ko.computed(function() {
        var possibleShops = [],
            locationLength = self.locations().length;

        for (var i = 0; i < locationLength; i++) {
            if (self.locations()[i].name().toLowerCase().indexOf(self.searchString().toLowerCase()) != -1) {
                possibleShops.push(self.locations()[i]);
                self.locations()[i].toggleMarker(map);
            } else {
                self.locations()[i].toggleMarker();
            }
        }
        //Making sure the array is sorted
        return possibleShops.sort(function(l, r) {
            return l.name() > r.name() ? 1 : -1;
        });
    });

    self.locations().forEach(function(downtownBars) {
        google.maps.event.addListener(downtownBars.marker, 'click', function() {
            self.clickHandler(downtownBars);
        });
    });

    //Interact with map markers
    self.clickHandler = function(downtownBars) {

        //Set map center to the marker
        map.setCenter(downtownBars.latLng());

        //Animate Marker
        if (downtownBars.marker.getAnimation() !== null) {
            downtownBars.marker.setAnimation(null);
        } else {
            downtownBars.marker.setAnimation(google.maps.Animation.BOUNCE);
        }


        //Close the infowindow if open previously
        self.infowindow.close();

        //Create popup InfoWindow
        self.infowindow = new google.maps.InfoWindow({
            maxHeight: 150,
            maxWidth: 200
        });

        //Fill window with content
        self.infowindow.setContent(popupInfo(downtownBars));

        //Open infoWindow
                self.infowindow.open(map, downtownBars.marker);
        };

};
ko.applyBindings(new appViewModel());