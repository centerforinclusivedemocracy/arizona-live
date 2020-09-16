/**
 * THIS FILE WAS GENERATED BY compile.py AND SHOULD NOT BE MANUALLY EDITED
 **/

$(document).ready(function () {
    initStatewideMap();
    initCountyListing();
});


let MAP;

function initStatewideMap () {
    // the map, a fixed basemap, a labels overlay, and our special map controls
    // note the ZoomBar which we add after we have GeoJSON data and therefore a home extent
    MAP = L.map('statemap', {
        zoomControl: false,
        maxZoom: 18,
        minZoom: 6,
    });

    new L.controlCredits({
        image: './images/greeninfo.png',
        link: 'https://www.greeninfo.org/',
        text: 'Interactive mapping<br/>by GreenInfo Network',
        position: 'bottomright',
    })
    .addTo(MAP);

    L.control.scale({
        position: 'bottomleft',
        updateWhenIdle: true
    })
    .addTo(MAP);

    MAP.BASEMAPBAR = new L.Control.BasemapBar({
        position: 'topright',
        layers: BASEMAP_OPTIONS,
    })
    .addTo(MAP)
    .selectLayer(BASEMAP_OPTIONS[0].label);

    new L.Control.StatewideMapLegend({
    }).addTo(MAP);

    // load the GeoJSON of county boundaries, add to the map, with a mouseover effect based on the county being in PARTICIPATING_COUNTIES
    $.get('data/counties.js', function (data) {
        MAP.COUNTYOVERLAY = L.geoJson(data, {
            style: function (feature) {
                let countyinfo;
                try {
                    countyinfo = getParticipatingCountyInfo(feature.properties.countyfp);
                } catch (error) {}  // catch = leave undefined, it's OK

                if (! countyinfo) return BOUNDSTYLE_DEFAULT;  // not participating, default style

                switch (countyinfo.profile) {
                    case 'fullmodel':
                        return BOUNDSTYLE_FULL;
                    case 'lite':
                        return BOUNDSTYLE_LITE;
                    default:
                        console.error(`County ${countyinfo.countyfp} has unknown profile '${countyinfo.profile}' for styling map`);
                        return BOUNDSTYLE_DEFAULT;  // not known, so punt with this and the error message
                }
            },
            onEachFeature: function (feature, layer) {
                // tooltip = the county name and invitation to click
                let countyinfo;
                try {
                    countyinfo = getParticipatingCountyInfo(feature.properties.countyfp);
                } catch (error) {}  // catch = leave undefined, it's OK


                let message = 'Not analyzed';
                if (countyinfo) {
                    switch (countyinfo.profile) {
                        case 'fullmodel':
                            message = 'Suggested Voting Locations';
                            break;
                        case 'lite':
                            message = 'Community-Level Demographic and Voter Data';
                            break;
                        default:
                            console.error(`County ${countyinfo.countyfp} has unknown profile '${countyinfo.profile}' for creating tooltip`);
                            message = 'Unknown status';
                            break;
                    }
                }

                const popupcontent = `<h1>${feature.properties.name}</h1>${message}`;

                layer.bindTooltip(popupcontent, { sticky: true });

                // click = go to the page
                if (countyinfo) {
                    const url = `county.html?county=${feature.properties.countyfp}`;
                    layer.on('click', function () { document.location.href = url; });
                }
            },
        })
        .addTo(MAP);

        const bbox = MAP.COUNTYOVERLAY.getBounds();
        MAP.fitBounds(bbox);

        // now that we have a home bounds, add the zoom+home control then the geocoder control under it (they are positioned in sequence)
        MAP.ZOOMBAR = new L.Control.ZoomBar({
            position: 'topright',
            homeBounds: bbox,
        }).addTo(MAP);

        MAP.GEOCODER = L.Control.geocoder({
            position: 'topright',
            showUniqueResult: false,
            defaultMarkGeocode: false,
            placeholder: 'Search for address or place',
            collapsed: true,  // control is buggy if expanded, won't close results list
        })
        .on('markgeocode', function (event) {
            MAP.fitBounds(event.geocode.bbox);
        })
        .addTo(MAP);
    }, 'json');
}


function initCountyListing () {
    const $countybuttondiv = $('#countybuttons');
    const $filterinput = $('#countynamefilter');

    PARTICIPATING_COUNTIES.forEach(function (countyinfo) {
        const $button = $(`<a href="county.html?county=${countyinfo.countyfp}" class="btn btn-primary">${countyinfo.name}</a>`);
        $(`<div class="mb-1 text-md-right" data-county-name="${countyinfo.name}" data-county-fips="${countyinfo.countyfp}"></div>`).append($button).appendTo($countybuttondiv);
    });

    $filterinput.on('input', function () {
        const searchstring = $filterinput.val().trim().toUpperCase();

        const $buttondivs = $countybuttondiv.children('div[data-county-name]');
        const $matching = $buttondivs.filter(function () {
            const countyname = $(this).attr('data-county-name').toUpperCase();
            return searchstring ? countyname.indexOf(searchstring) != -1 : true;
        });

        $matching.removeClass('d-none');
        $buttondivs.not($matching).addClass('d-none');
    });
}
