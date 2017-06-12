session.input.readAsJSON(function(error, json) {
    
    var newData = {};
    for (let elem in json) {
        newData[elem] = json[elem];
    }
    newData.newField = "added by request processor";
    session.output.write(newData);
});