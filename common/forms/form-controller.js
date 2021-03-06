var formController = function($rootScope, $scope, $http, $parse) {
    console.log("FormController Starting Up!");
    $scope.eval = $scope.$eval;
    $rootScope.$watch('currentUser', function () {
        console.log('change currentUser');
        console.log($rootScope.currentUser);
        $scope.currentUser = $rootScope.currentUser;
    });

    $rootScope.$watch('currentForm', function () {
        console.log('change currentForm');
        console.log($rootScope.currentForm);
        $scope.currentForm = $rootScope.currentForm;
    });

    if(window.location.host != "localhost"){
        $rootScope.baseUrl = "http://api.medicaxess.com";
        //$rootScope.baseUrl = "http://medicaxess-padtronics.rhcloud.com/"
    }else{
        $rootScope.baseUrl = "http://localhost:8080";
    }

    $scope.baseUrl = $rootScope.baseUrl+"/forms";

    $scope.newForm = function(){
        $rootScope.currentForm = {
            displayname: "Default Example Form (change me)",
            collection: "users",
            scope: "all",
            recordtype: "user.forms",
            fields: []
        };
    };

    $scope.formInf ={
        //Scopes limit edit horizon of a form to within some degree of relationship with the creator
        //Self is creator
        //Subordinate is anyone who works FOR the creator
        //Location is anyone who works WITH the creator
        //Everyone is global
        scopes : [
            {name: "Self", value: "self"},
            {name: "Subordinates", value: "subordinate"},
            {name: "Location", value: "location"},
            {name: "Everyone", value: "all"}

        ],
        //Collections define which database and thereby which API & ruleset apply to the objects created by this form
        //This defines where the object will be stored, current just patient-info, patient-data & users
        //
        collections : [
            {name: "Patient Records", value: "patients"},
            {name: "Employee Records", value: "users"}
        ],
        //recordtype is a custom searching and indexing field for the use of the form creator
        //Below are some examples
        recordtypes : [
            {name: "Patient Forms (General)", value: "patient.forms.general"},
            {name: "Patient Forms (Vitals)", value: "patient.forms.vitals"},
            {name: "Patient Forms (Appointments)", value: "patient.forms.appointments"}
        ]
    };

    function enumerateFields(){
        var array = [
            {name: "Record - at time of service", value: 'currentRecord'},
            {name: "Patient - at time of service", value: 'currentPatient'},
            {name: "User - Person Inputting Data", value: 'currentUser'},
            {name: "Location of User - at time of service", value: 'currentLocation'},
        ];
        if($rootScope.currentPatient) {
            var keys = Object.keys($rootScope.currentPatient);
            keys.forEach(function (key, index, keys) {
                if ($rootScope.currentPatient.hasOwnProperty(key)) {
                    if (!Array.isArray($rootScope.currentPatient[key])) {
                        var obj = {};
                        obj.name = key;
                        obj.value = "currentPatient." + key;
                        array.push(obj);
                    }
                }
            });
        }
        /*
        keys = Object.keys($rootScope.currentUser);
        keys.forEach(function(key, index,keys){
            if($rootScope.currentUser.hasOwnProperty(key)) {
                if(!Array.isArray($rootScope.currentPatient[key])) {
                    var obj = {};
                    obj.name = key;
                    obj.value = "currentUser." + key;
                    array.push(obj);
                }
            }
        });
        */

        console.log("Patient array: ", array);
        return array;
    }
    //Allows binding of field defaults to current Objects
    $scope.fieldInf  = {

        bindings : enumerateFields(),

        fieldtypes : [
            {name: "Label - Read only, use databind for content",   value: "label" },
            {name: "Plain Text - Single Line",                      value: "text"},
            {name: "Plain Text - Multi Line",                       value: "textarea"},
            {name: "Photograph or Other Image",                     value: "photo"},
            {name: "Video (from file, or camera)",                  value: "video"},
            {name: "Color",                                         value: "color"},
            {name: "Email",                                         value: "email"},
            {name: "URL",                                           value: "url"},
            {name: "Checkbox",                                      value: "checkbox"},
            {name: "Radio Button",                                  value: "radio" },
            {name: "DataList - DB collection",                      value: "list"},
            {name: "List - custom (add fields below)",              value: "list"},
            {name: "Telephone Number",                              value: "tel"},
            {name: "Number",                                        value: "number"},
            {name: "Range",                                         value: "range"},
            {name: "Month",                                         value: "month"},
            {name: "Week",                                          value: "week"},
            {name: "Time",                                          value: "time"},
            {name: "Date (yyyy/mm/dd)",                             value: "date"},
            {name: "Date & Time (with timezone)",                   value: "datetime"},
            {name: "Date & Time (no timezone)",                     value: "datetime-local"}
        ]
    };

    $scope.addField = function(field){
        console.log("Adding a field");
        var fields = $rootScope.currentForm.fields;
        var index = fields.indexOf(field);
        console.log("Index: ",index);
        var newField = {
            displayname: "New Field",
            collapsed: true
        };
        if(index == -1){
            fields.push(newField);
        }else {
           fields.splice(index+1, 0, newField);
        }
        console.log("fields: ",fields);
        $rootScope.currentForm.fields = fields;
        return fields;
    };

    $scope.deleteField = function(field){
        console.log("Deleting a field");

        var fields = $rootScope.currentForm.fields;
        fields.splice(fields.indexOf(field), 1);
        $rootScope.currentForm.fields = fields;

        return fields;
    };

    $scope.moveField = function(field, updown){
        console.log("Moving a field: ",field);
        var fields = $rootScope.currentForm.fields;
        var index =  fields.indexOf(field);
        console.log("From: ",index);
        var offset = index;
        if(updown == 'up'){
            if(offset > 0) {
                offset--;
            }else{
                offset = fields.length -1;
            }
        }else{
            if(offset < fields.length -1) {
                offset++;
            }else{
                offset = 0;
            }
        }
        console.log("To: ", offset);
        //fields.move(index,1,offset);
        $scope.deleteField(field);
        fields.splice(offset,0,field);
        $rootScope.currentForm.fields = fields;
    };

    $scope.addListItem = function(field){
        if(field.list == undefined){
            field.list = [];
        }
        field.list.push({});
    };

    $scope.removeListItem = function(field, item){
        var index = field.list.indexOf(item);
        field.list.splice(index,1);
    };

    $scope.toggleCollapse = function(field){
        console.log("Toggling collapse of "+field.displayname);
        field.collapsed = !field.collapsed;
        $("#" + field).collapse('toggle');
    };

    $scope.saveForm = function(){
        if(!$rootScope.currentForm.hasOwnProperty("_id")){

            $rootScope.currentForm.owner_id = $rootScope.currentUser._id;
            $http.post($scope.baseUrl,$rootScope.currentForm)
                .success(function(data){
                    $scope.fetchAllForms();
                    window.alert("Form has been successfully saved, you can now reference it by name or by id");
                })
                .error(function(error){
                    console.error(error);
                    window.alert("There has been an error in persisting the form");
                });
        }else{
            var url = $scope.baseUrl+"/"+$rootScope.currentForm._id
            $http.put(url,$rootScope.currentForm)
                .success(function(data){
                    $scope.fetchAllForms();
                    window.alert("Changes to your form have been saved!")
                })
                .error(function(error){
                    console.error(error);
                    window.alert("There has been an error in persisting the form, it appears you were logged out, you will be returned to the login screen now.");
                    //$rootScope.app.state = undefined;
                });
        }


    };
    $scope.startsWith = function(data, str){
        return data.lastIndexOf(str, 0) === 0
    };

    $scope.collateFields = function(fields,data){
        console.log("fields: ", fields);
        console.log("data: ",data);
        var obj = {};
        for(var field in fields){
            var fieldName = fields[field].variable;
            console.log("field: ", fieldName);
            if(data[fieldName]){
                console.log("value: ", data[fieldName].$viewValue);
                obj[fieldName] = data[fieldName].$viewValue;
            }
        }
        console.log("returning object: ",obj);
        return obj;
    };

    $scope.saveFormData = function(form){
        console.log("saving: ",form);


        console.log("scope.currentUser: ",$scope.currentUser);
        console.log("rootScope.currentUser: ",$rootScope.currentUser);
        console.log("scope.currentForm: ",$scope.currentForm);
        console.log("rootScope.currentForm: ", $rootScope.currentForm);
        console.log("form: ",form);
        //Strategy...

        //construct a formData object comprised of the field.name & field.value objects and preserve that to /{collection} to produce a "record object"
        var fields = $scope.currentForm.fields;
        var formData = $scope.collateFields(fields,form);
        //if form-type == patient then set the patient_id: = currentPatient._id
        //Also append the origin form-id to the new record in the form of form_id = currentForm._id
        formData["collection"] = $scope.currentForm.collection;
        formData["source_form"] = $scope.currentForm._id;
        if($scope.startsWith($scope.currentForm.recordtype,"patient")){
            formData["patient_id"] = $rootScope.currentPatient._id;
        }

        var loc = $scope.currentForm.collection;
        console.log("saving it to: ",$rootScope.baseUrl+"/"+loc);



         $http.post($rootScope.baseUrl+"/"+loc, formData)
             .success(function(data){
                 console.log("saveFormData returned: ",data);

                 //Attach to parent (if needed)
                 if($scope.currentForm.dataparent){
                     var parent = $scope.currentForm.dataparent;
                     if(!Array.isArray($rootScope[parent].records)){
                         $rootScope[parent].records = [];
                     }

                     var recordInfo = {
                         collection: $scope.currentForm.collection,
                         id: data._id
                     };

                    $rootScope[parent].records.push(recordInfo);
                 }
                 //Loop through each of the data-bindings, compare to globals, and preserve them using the normal process.

                 $scope.preserveGlobals(fields);

                 window.alert("Successfully saved changes!  If you were in the middle of a workflow, you should now 'next'.");
             })
             .error(function(error){
                console.error(error)
             });

    };

    /**
     * Can be only used with self aware objects, i.e. those that know their own _id and collection already
     * @param object
     */
    $scope.updateObject = function(object){
        console.log("Attempting to update ",object);
        if(!object.collection || !object._id){
            console.error("object was missing it's collection or _id fields and could not be updated ",object);
            return;
        }
        var collection = object.collection;
        var id = object._id;
        var url = $rootScope.baseUrl+"/"+collection+"/"+id;
        $http.put(url,object)
            .success(function(data){
                console.log("Successfully put ",object);
            })
            .error(function(err){
                console.error(err);
            });

    };

    /**
     * Given a list of fields from a form object, will attempt to preserve any databind globals
     * @param fields
     */
    $scope.preserveGlobals = function(fields){
        var globals = {};
        console.log("preserving globals on fields: ",fields);
        //Loop through fields looking for databind attribute and mark true if present
        console.log("fields.length: "+fields.length);
        for(var i = 0; i <= fields.length -1; i++){
            var databind = fields[i]["databind"];
            console.log("field[i]: ",fields[i]);
            console.log("databinding: ",databind);
            if(databind == null || databind === ""){
                continue
            }

            if($scope.startsWith(databind,"currentUser")){
                globals.currentUser = $scope.currentUser;
                continue
            }
            if($scope.startsWith(databind,"currentPatient")){
                globals.currentPatient = $scope.currentPatient;
                continue
            }
            if($scope.startsWith(databind,"currentLocation")){
                globals.currentLocation = $scope.currentLocation;
                continue
            }
            if($scope.startsWith(databind,"currentEquipment")){
                globals.currentEquipment = $scope.currentEquipment;
                continue
            }
            if($scope.startsWith(databind,"currentWorkflow")){
                globals.currentWorkflow = $scope.currentWorkflow;
                continue
            }
            if($scope.startsWith(databind,"currentEncounter")){
                globals.currentEncounter = $scope.currentEncounter;
                continue
            }
            if($scope.startsWith(databind,"currentRecord")){
                globals.currentRecord = $scope.currentRecord;
            }
        }

        var keys = Object.keys(globals);
        keys.forEach(function(name,index){
            console.log("name: ", name);
            console.log("index: ", index);
            //Update the rootScope (since it's globals here)
            var newKeys = Object.keys(globals[name]);
            newKeys.forEach(function(field,idx){
                $rootScope[name][field] = globals[name][field];
                console.log("field: ",$rootScope[name][field])
            });
            //Perist object to DB
            $scope.updateObject($rootScope[name])
        });

    };
    $scope.cloneForm = function(form){
        var newForm = form;
        delete newForm._id;
        $rootScope.currentForm = newForm;
    };

    $scope.appendField = function(field){

        var newField = Object.create(field);
        if(!field.counter){
            field.counter = 0;
        }
        newField.name = newField.name+field.counter++;
        if(newField.databind){
            newField.databind = newField.databind+field.counter;
        }
        newField.displayname = newField.displayname +" "+field.counter;
        $scope.currentForm.fields.push(newField);
    };
    $scope.fetchForm = function(name, id){
      name = encodeURIComponent(name);
      $http.get($scope.baseUrl+"/"+name)
          .success(function(data){
              console.log(data);
              $rootScope[id] = data;
          })
          .error(function(error){
              console.error(error);
              window.alert("There was a problem fetching a required form")
          })
    };

    $scope.fetchAllForms = function(){
        console.log("Fetching all forms from "+$scope.baseUrl);
        $http.get($scope.baseUrl)
            .success(function(data){
                console.log("forms: ",data);
                $rootScope['forms'] = data;

            })
            .error(function(error){
                console.error(error);
                window.alert("There was a problem fetching a required form")
            })
    };

    $scope.deleteForm = function(form){
        var id = form._id;
        delete $rootScope.forms[form];
        $http.delete($scope.baseUrl+"/"+id)
            .success(function(data){
                $scope.fetchAllForms();
                window.alert("You have successfully deleted a form")
            })
            .error(function(err){
                console.error(err)
                window.alert("There was a problem deleting that form, possibly it was locked, out of sync or already deleted.  Try again later")
            })
    };
    /**
     * This sets a rootScope object to an arbitrary form
     * e.g. displayname, Profile, currentForm will set $rootScope.currentForm = {displayname: Profile ...}
     * @param haystack (the field to search in rootScope.forms
     * @param needle (the value to search for)
     * @param id (the field off rootScope to set if/when the form is found)
     */
    $scope.setForm = function(haystack,needle,id){

        console.log("Looking for ",needle," in ",haystack," to set ", id);

        console.log("Available Forms: ",$rootScope['forms']);
        var forms = $rootScope['forms'];
        if(Array.isArray(forms)) {
            for (var i = 0; i <= forms.length; i++) {
                console.log("form: ", forms[i]);
                if (forms[i][haystack] == needle) {
                    $rootScope[id] = forms[i];
                    break;
                }
            }
        }else{
            var name = encodeURIComponent(needle);
            $http.get($scope.baseUrl+"/"+name)
                .success(function(data){
                    console.log(data);
                    $rootScope.currentForm = data[0]
                })
                .error(function(error){
                    console.error(error);
                    window.alert("There was a problem fetching a required form")
                })
        }
    };

    $scope.fetchJSON = function(){

        var filename = "/js/idc10.json";

        $http.get(filename)
            .success(function(data){
                if(!$rootScope.json){
                    $rootScope.json = {};
                }
                $rootScope["json.idc10"] = data;
                console.log("json.idc10: Loaded");
            })
            .error(function(err){
                console.error(err);
            });
    };


    /**
     * Used to populate a datalist for custom forms
     * CAUTION: Only use this function for datasources with a limited number of entries, too many will slow down the app.
     * @param source
     * @returns {*}
     */
    $scope.getDataSourceItems = function(source){
        console.log("Attempting to find: ",source);
        if(!source){
            console.log("source was undefined, returning an empty set");
            return [{name: 'undefined', value: null}];
        }

        if(!$rootScope[source+"try"]){
            $rootScope[source+"try"] = 1;
        }
        if(!$rootScope[source] && $rootScope[source+"try"] < 2){
            $rootScope[source+"try"]++;
            console.log("About to load: ",$rootScope.baseURL+"/"+source);
            $http.get($rootScope.baseURL+"/"+source)
                .success(function(data){
                    console.log("Found: ",data[0]);
                    $rootScope[source] = data[0];
                })
                .error(function(err){
                    console.error(err);
                    window.alert("A referenced data source is missing: "+source);
                    $rootScope.source = err;
                });
        }else{
            if($rootScope[source]) {
                console.log("Had it already: ",$rootScope[source]);
                return $rootScope[source];
            }else{
                console.log("Didn't have it, and count was high enough to abandon, sending empty set.");
                $rootScope[source] = [];
                window.alert("A referenced datasource for this form is missing, please have the creator examine the fields for "+source);
                return $rootScope[source];
            }
        }
    };
    $scope.searchDataSource = function(field){
        console.log("Attempting to find: ",field.datasource);
        if(!field.datasource){
            console.log("source was undefined, returning an empty set");
           return;
        }
        field.source = field.datasource;
        if(!$rootScope[field.source+"try"]){
            $rootScope[field.source+"try"] = 1;
        }
        if(!$rootScope[field.source] && $rootScope[field.source+"try"] < 2){
            $rootScope[field.source+"try"]++;
            console.log("About to load: ",$rootScope.baseURL+"/"+field.source);
            $http.get($rootScope.baseURL+"/"+field.source)
                .success(function(data){
                    console.log("Found: ",data[0]);
                    $rootScope[field.source] = data[0];
                })
                .error(function(err){
                    console.error(err);
                    window.alert("A referenced data source is missing: "+source);
                    $rootScope[field.source] = err;
                });
            return;
        }else{
            var count = 0;
            var matching = [];
            console.log("field: ",field);
            for(pos in $rootScope[field.source]){

                var source = $rootScope[field.source];
                var entry = source[pos];
                if(count > 10 ){
                    console.log("Limit reached for: ",field.value);
                    break;
                }
                var value = field.value.toLowerCase();
                if(entry.name.toLowerCase().contains(value) || entry.value.toLowerCase().contains(value)){
                    matching.push(entry);
                    count++;
                    //console.log("Found: ",$rootScope[source][entry]);
                }
                /*
                count++;
                if(count < 100) {
                    console.log("entry: ", $rootScope[field.source][entry]);
                }else{
                    break;
                }*/
            }
            field.list = matching;
        }


    };
    $scope.parseValue = function (value) {
        //console.log("parsing: ",value);
        var val = $parse(value)($scope);
        if(!val){
            val = "indefinido"
        }
        return val;
    };

    $scope.editForm = function(form){
        $rootScope.currentForm = form;
    };
    $rootScope.setForm = $scope.setForm;
    $rootScope.fetchForms = $scope.fetchAllForms;
    $rootScope.onLogin.push($scope.fetchAllForms);
    $rootScope.onLogin.push($scope.fetchJSON);

};

angular.module('customforms',[])
    .controller('FormController', ['$rootScope','$scope', '$http','$parse', formController])
    .directive('formWidget',function(){
        console.log("Loading directive form-widget");
        return {
            restrict: 'E',
            replace: 'true',
            templateUrl: '/views/widgets/form-widget.html'
        }
    })
    .directive('formListWidget',function(){
        console.log("Loading directive form-list-widget");
        return {
            restrict: 'E',
            replace: 'true',
            templateUrl: '/views/widgets/form-list-widget.html'
        }
    })
    .directive('formEditWidget',function(){
        console.log("Loading directive form-edit-widget");
        return {
            restrict: 'E',
            replace: 'true',
            templateUrl: '/views/widgets/form-edit-widget.html'
        }
    })
    .directive('fieldAdjustWidget',function(){
        console.log("Loading directive field-adjust-widget");
        return {
            restrict: 'E',
            replace: 'true',
            templateUrl: '/views/widgets/field-adjust-widget.html'
        }
    })
    .directive('fieldEditWidget',function(){
        console.log("Loading directive field-edit-widget");
        return {
            restrict: 'E',
            replace: 'true',
            templateUrl: '/views/widgets/field-edit-widget.html'
        }
    })
    .directive('customFormsArea',function(){
        console.log("Loading directive custom-forms-area");
        return {
            restrict: 'E',
            replace: 'true',
            templateUrl: '/views/partials/custom-forms-area.html'
        }
    })
    .directive('dynamicModel', ['$compile', function ($compile) {
        return {
            'link': function(scope, element, attrs) {
                scope.$watch(attrs.dynamicModel, function(dynamicModel) {
                    if (attrs.ngModel == dynamicModel || !dynamicModel) return;

                    element.attr('ng-model', dynamicModel);
                    if (dynamicModel == '') {
                        element.removeAttr('ng-model');
                    }

                    // Unbind all previous event handlers, this is
                    // necessary to remove previously linked models.
                    element.unbind();
                    $compile(element)(scope);
                });
            }
        };
    }])
;