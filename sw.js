self.importScripts("js/lib/dexie.js");

// config Dexie() for IndexedDB
var db = new Dexie("restaurants");
db.version(1).stores({
  urls: 'url,data',
  reviews_pending: 'url,data'
});
db.open();

// config for cache
var cacheWhitelist = ['cache-and-update-v1'];
var CACHE = cacheWhitelist[0];

self.addEventListener('install', function(evt) {
	console.log('The service worker is being installed.');	
	evt.waitUntil(precache());
});

self.addEventListener('activate', function(event) {
  console.log('Activating new service worker...', event);

  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      ).then(() => { console.log('AAAAAAAAAAA'); });
    })
  );
});

self.addEventListener('fetch', event => {
	//console.log('The service worker is serving the asset.', event.request);
  
  switch(event.request.method) {
    case 'GET':
      console.log('GET request!');
      // check if the request is for JSON
      if(event.request.url.includes(':1337')){
        event.respondWith(fromDB(event.request).catch((error) => {
          console.log(error);
        }));
        event.waitUntil(updateDB(event.request));
      }else{
        event.respondWith(fromCache(event.request).catch((error) => {
          console.log(error);
        }));
      
        event.waitUntil(updateCache(event.request));
      }
      break;
    case 'POST':
      console.log("POST request!", event.request);
      if(!navigator.onLine){
        // offline
        // add data to IndexedDB
        console.log('OFFLINE:', event);
        
        // event.respondWith(addReviewDB(event.request));
      }else{
        // online
        // check if there are data in pending in IndexedDB
        // event.waitUntil(updateReviews(event.request));
      }
      break;
  }

  //if(event.request.method != 'GET') return;
  
  
});

function precache() {
  return caches.open(CACHE).then(function (cache) {
    return cache.addAll([
			'./',
			'./index.html',
			'./restaurant.html',
			//'./css/styles.css',
      //'./css/responsive.css',
      './css/combined.css',
			'./js/main.js',
			'./js/restaurant_info.js',
			'./js/dbhelper.js',
      './js/register_sw.js',
      './js/combined.js',
			'./img/1.jpg', './img/1-480.jpg',
			'./img/2.jpg', './img/2-480.jpg',
			'./img/3.jpg', './img/3-480.jpg',
			'./img/4.jpg', './img/4-480.jpg',
			'./img/5.jpg', './img/5-480.jpg',
			'./img/6.jpg', './img/6-480.jpg',
			'./img/7.jpg', './img/7-480.jpg',
			'./img/8.jpg', './img/8-480.jpg',
			'./img/9.jpg', './img/9-480.jpg',
			'./img/10.jpg', './img/10-480.jpg'
    ]);
  });
}

function fromCache(request) {
  return caches.open(CACHE).then(function (cache) {
    return cache.match(request).then(function (matching) {
      return matching || fetch(request); //Promise.reject('no-match'); 
    });
  });
}

function updateCache(request) {
  return caches.open(CACHE).then(function (cache) {
    return fetch(request).then(function (response) {
      return cache.put(request, response);
    });
  });
}


// functions for IndexedDB
function updateDB(request){
  return fetch(request).then(function (response) {
    //console.log(response);
    return response.json();
  }).then( response => {
    //console.log('updateDB:', response);
    return db.urls.put({url: request.url, data: response});
  }).catch(error => {
    console.log(error);
  });
}

function fromDB(request){
  return  db.urls.get(request.url).then(function (matching) {
    return (matching) ? new Response(JSON.stringify(matching.data)) : fetch(request);
  });
}

// add review to IndexedDB
function addReviewDB(request){
  // serialize(request).then(serialized => {
  // 
  // });
}

// send all offline reviews to server
function updateReviewDB(request){
  // return db.reviews_pending().then(data => {
  // 
  // });
}

function serialize(request){
  let headers = {};

  for(let entry of request.headers.entries()){
    headers[entry[0]] = entry[1];
  }

  let serialized = {
    url: request.url,
    headers: headers,
    method: request.method,
    mode: request.mode,
    credentials: request.credentials,
    cache: request.cache,
    redirect: request.redirect,
    referrer: request.referrer
  };

  if(request.method !== 'GET' && request.method !== 'HEAD'){
    return request.clone().text().then(body => {
      serialized.body = body;
      return Promise.resolve(serialized);
    });
  }
  return Promise.resolve(serialized);
}