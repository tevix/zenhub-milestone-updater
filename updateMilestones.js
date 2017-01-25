var request = require("request");
var async = require("async")
var argv = require('yargs').argv;

//input params
var milestoneToFind = argv.milestoneToFind;
var newMilestoneTitle = argv.newMilestoneTitle;
var newMilestonDescription = argv.newMilestoneDescription;
var newDueOn = argv.newMilestoneDueOn;
var repoOwner = argv.repoOwner;
var authToken = argv.authToken;
var authUser = argv.authUser;
///
var milestonesFoundArr = [];
var options = {
    method: 'GET',
    url: 'https://api.github.com/user/repos',
    headers: {
        'user-agent': authUser,
        'authorization': 'token '.concat(authToken)
    }
};

request(options, function (error, response, body) {
    if (error) throw new Error(error);


    var repos = JSON.parse(body);
    var tvxRepos = [];
    for (var i = 0; repos.length > i; i++) {
        if (repos[i].owner.login == repoOwner) {
            tvxRepos.push(repos[i].name);
        }
    }
    console.log('have found '.concat(tvxRepos.length.toString(), " repos for ", repoOwner));

    async.map(tvxRepos, function (item, callback) {
        //get milestone numbers and return an object with repo and milestone


        var options = {
            method: 'GET',
            url: 'https://api.github.com/repos/'+repoOwner+'/' + item + '/milestones',
            headers: {
                'user-agent': authUser,
                'authorization': 'token '.concat(authToken)
            }
        };

        request(options, function (error, response, body) {
            if (error) throw new Error(error);
            var retVal = {repo: item, milestoneName: "", milestoneNumber: 0};
            var milestones = JSON.parse(body);
            for (var h = 0; milestones.length > h; h++) {

                if (milestones[h].title == milestoneToFind) {
                    retVal.milestoneNumber = milestones[h].number;
                    retVal.milestoneName = milestones[h].title;
                    retVal.repoName = item;
                }
            }
            callback(null, retVal);
        });


    }, function (err, results) {
        for (j = 0; results.length > j; j++) {
            if (results[j].milestoneNumber > 0) {
                milestonesFoundArr.push(results[j]);
            }
        }
        console.log('and '.concat(milestonesFoundArr.length.toString(), ' of they have the milestone title: ', milestoneToFind));

        //update those repos (CREATE ASYNC CALL TO )
        if (milestonesFoundArr.length > 0) {
            async.map(milestonesFoundArr, function (milestoneFound, callback) {
                console.log('updating: '.concat(milestoneFound.repoName, ' ', milestoneFound.milestoneNumber));
                var options = {
                    method: 'PATCH',
                    url: 'https://api.github.com/repos/'+ repoOwner +'/' + milestoneFound.repoName + '/milestones/' + milestoneFound.milestoneNumber,
                    headers: {
                        'content-type': 'application/json',
                        'user-agent': authUser,
                        'authorization': 'token '.concat(authToken)
                    },
                    body: {
                        title: newMilestoneTitle,
                        description: newMilestonDescription,
                        due_on: newDueOn
                    },
                    json: true
                };

                request(options, function (error, response, body) {
                    if (error) callback(error, null);
                    callback(null, 'milestone updated on '.concat(milestoneFound.repoName));
                });

            }, function (err, results) {
                console.log('We finally update '.concat(results.length.toString(), ' milestones'));
            });
        }else{
            console.log("nothing needs to be updated ");
        }

    })

});
