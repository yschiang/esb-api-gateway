session.input.readAsJSON(function(error, json) {
    
    json.newField = "added by response processor";
    session.output.write(json);
});