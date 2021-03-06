var fs = require("fs"),
    hc_path = "../index.js",
    hithercontent = require(hc_path),
    auth = JSON.parse(fs.readFileSync("_auth.json", { "encoding": "utf8" })),
    expect = require("chai").expect,
    https = require("https"),
    sinon = require("sinon"),
    PassThrough = require("stream").PassThrough;

var project_overview = {
    "data": [
        { "id": 1, "parent_id": 0 },
        { "id": 2, "parent_id": 0 },
        { "id": 11, "parent_id": 1 },
        { "id": 12, "parent_id": 1 },
        { "id": 121, "parent_id": 12 },
        { "id": 122, "parent_id": 12 },
        { "id": 123, "parent_id": 12 },
        { "id": 21, "parent_id": 2 },
        { "id": 22, "parent_id": 2 },
        { "id": 221, "parent_id": 22 }
    ]
};

var project_content = {
    "1": { "data": { "id": 1, "position": "1", "config": [ { "label": "First tab", "elements": [ { "type": "text", "label": "Text element", "value": "Lorem ipsum" } ] } ] } },
    "2": { "data": { "id": 2, "position": "4", "config": [ { "label": "First tab", "elements": [ { "type": "text", "label": "Text element", "value": "Lorem ipsum" } ] } ] } },
    "11": { "data": { "id": 11, "position": "2", "config": [ { "label": "First tab", "elements": [ { "type": "text", "label": "Text element", "value": "Lorem ipsum" } ] } ] } },
    "12": { "data": { "id": 12, "position": "3", "config": [ { "label": "First tab", "elements": [ { "type": "text", "label": "Text element", "value": "Lorem ipsum" } ] } ] } },
    "121": { "data": { "id": 121, "position": "7", "config": [ { "label": "First tab", "elements": [ { "type": "text", "label": "Text element", "value": "Lorem ipsum" } ] } ] } },
    "122": { "data": { "id": 122, "position": "6", "config": [ { "label": "First tab", "elements": [ { "type": "text", "label": "Text element", "value": "Lorem ipsum" } ] } ] } },
    "123": { "data": { "id": 123, "position": "5", "config": [ { "label": "First tab", "elements": [ { "type": "text", "label": "Text element", "value": "Lorem ipsum" } ] } ] } },
    "21": { "data": { "id": 21, "position": "8", "config": [ { "label": "First tab", "elements": [ { "type": "text", "label": "Text element", "value": "Lorem ipsum" } ] } ] } },
    "22": { "data": { "id": 22, "position": "9", "config": [ { "label": "First tab", "elements": [ { "type": "text", "label": "Text element", "value": "Lorem ipsum" } ] } ] } },
    "221": { "data": { "id": 221, "position": "10", "config": [ { "label": "First tab", "elements": [ { "type": "text", "label": "Text element", "value": "Lorem ipsum" } ] } ] } }
};

describe("Using the branch selector", function () {

    before(function () {
        hithercontent.init(auth);
    });

    after(function() {
        hithercontent.reset()
    })

    beforeEach("using mock API to approximate GatherContent", function () {
        sinon.stub(https, "get", function (options, callback) {
            var request = new PassThrough(),
                response = new PassThrough(),
                auth_check = auth.user + ":" + auth.akey,
                path = options.hasOwnProperty("path") && options.path,
                item_number;
            if (typeof callback === "function") {
                callback(response);
            }
            if (options.hasOwnProperty("auth") && (options.auth === auth_check)) {
                if (path === "/items?project_id=111111") {
                    response.write(JSON.stringify(project_overview));
                } else if (item_number = path.match(/\/items\/(.*)/)) {
                    if (project_content.hasOwnProperty(item_number[1])) {
                        response.write(JSON.stringify(project_content[item_number[1]]));
                    }
                }
            } else {
                response.write("Invalid credentials.")
            }
            response.end();
            return request;
        });
    });

    afterEach("restoring real API call", function () {
        https.get.restore();
    });

    describe("without specifiying an item id", function() {
        it("should return an object", function (done) {
            hithercontent.getProjectBranch(111111, function (branch) {
                expect(branch).to.be.an("object");
                done();
            });
        });

        it("should return an object with an items property", function (done) {
            hithercontent.getProjectBranch(111111, function (branch) {
                expect(branch).to.have.keys("items");
                done();
            });
        });

        it("should return an object with an items property containing only the top-level items", function (done) {
            hithercontent.getProjectBranch(111111, function (branch) {
                expect(branch.items).to.have.length(2);
                done();
            });
        });

        it("should return an object with an items property whose children all have tier properties", function (done) {
            hithercontent.getProjectBranch(111111, function (branch) {
                expect(branch.items).to.satisfy(i => i.reduce((p, c) => p && c.hasOwnProperty("tier")), true);
                done();
            });
        });

        it("should return an object with an items property whose children all have a tier of 1", function (done) {
            hithercontent.getProjectBranch(111111, function (branch) {
                expect(branch.items).to.satisfy(i => i.reduce((p, c) => p && c.tier === 1, !!i.length));
                done();
            });
        });

        it("should return an object with the first item having an id of '1'", function (done) {
            hithercontent.getProjectBranch(111111, function (branch) {
                expect(branch.items[0]).to.have.property("id", 1);
                done();
            });
        });

        it("should return an object with the first item having the two child items as specified", function (done) {
            hithercontent.getProjectBranch(111111, function (branch) {
                expect(branch.items[0].items).to.have.length(2);
                done();
            });
        });

        it("should return an object with an items property whose first item's children all have tier properties", function (done) {
            hithercontent.getProjectBranch(111111, function (branch) {
                expect(branch.items[0].items).to.satisfy(i => i.reduce((p, c) => p && c.hasOwnProperty("tier")), true);
                done();
            });
        });

        it("should return an object with an items property whose first item's children all have a tier of 2", function (done) {
            hithercontent.getProjectBranch(111111, function (branch) {
                expect(branch.items[0].items).to.satisfy(i => i.reduce((p, c) => p && c.tier === 2, !!i.length));
                done();
            });
        });

        it("should return an object with the first item's first child item having an id of '11'", function (done) {
            hithercontent.getProjectBranch(111111, function (branch) {
                expect(branch.items[0].items[0]).to.have.property("id", 11);
                done();
            });
        });


        it("should return an object with the first item's second child item having an id of '12'", function (done) {
            hithercontent.getProjectBranch(111111, function (branch) {
                expect(branch.items[0].items[1]).to.have.property("id", 12);
                done();
            });
        });

        it("should return an object with the first item's second child having correct number of child items", function (done) {
            hithercontent.getProjectBranch(111111, function (branch) {
                expect(branch.items[0].items[1].items).to.have.length(3);
                done();
            });
        });

        it("should return an object with an items property whose first item's second item's children all have tier properties", function (done) {
            hithercontent.getProjectBranch(111111, function (branch) {
                expect(branch.items[0].items[1].items).to.satisfy(i => i.reduce((p, c) => p && c.hasOwnProperty("tier")), true);
                done();
            });
        });

        it("should return an object with an items property whose first item's second item's children all have a tier of 3", function (done) {
            hithercontent.getProjectBranch(111111, function (branch) {
                expect(branch.items[0].items[1].items).to.satisfy(i => i.reduce((p, c) => p && c.tier === 3, !!i.length));
                done();
            });
        });

        it("should return an object with ordering of items according to positioning", function (done) {
            hithercontent.getProjectBranch(111111, function (branch) {
                expect(branch.items[0].items[1].items).to.eql([
                    { "id": 123, "position": "5", "tier": 3, "items": [], "config": [ { "label": "First tab", "elements": [ { "type": "text", "label": "Text element", "value": "Lorem ipsum" } ] } ] },
                    { "id": 122, "position": "6", "tier": 3, "items": [], "config": [ { "label": "First tab", "elements": [ { "type": "text", "label": "Text element", "value": "Lorem ipsum" } ] } ] },
                    { "id": 121, "position": "7", "tier": 3, "items": [], "config": [ { "label": "First tab", "elements": [ { "type": "text", "label": "Text element", "value": "Lorem ipsum" } ] } ] }
                ]);
                done();
            });
        });

        describe("but with an identity function acting on each item", function () {
            it("should return an object", function (done) {
                hithercontent.getProjectBranch(111111, i => i, function (branch) {
                    expect(branch).to.be.an("object");
                    done();
                });
            });

            it("should return an object with an items property", function (done) {
                hithercontent.getProjectBranch(111111, i => i, function (branch) {
                    expect(branch).to.have.keys("items");
                    done();
                });
            });

            it("should return an object with all two items from the root", function (done) {
                hithercontent.getProjectBranch(111111, i => i, function (branch) {
                    expect(branch.items).to.have.length(2);
                    done();
                });
            });

            it("should return an object with an items property whose first item contains a data property", function (done) {
                hithercontent.getProjectBranch(111111, i => i, function (branch) {
                    expect(branch.items[0]).to.have.property("data");
                    done();
                });
            });

            it("should return an object with an items property whose children all have tier properties", function (done) {
                hithercontent.getProjectBranch(111111, i => i, function (branch) {
                    expect(branch.items).to.satisfy(i => i.reduce((p, c) => p && c.hasOwnProperty("tier")), true);
                    done();
                });
            });

            it("should return an object with an items property whose children all have a tier of 1", function (done) {
                hithercontent.getProjectBranch(111111, i => i, function (branch) {
                    expect(branch.items).to.satisfy(i => i.reduce((p, c) => p && c.tier === 1, !!i.length));
                    done();
                });
            });

            it("should return an object with an items property whose first item contains an items property", function (done) {
                hithercontent.getProjectBranch(111111, i => i, function (branch) {
                    expect(branch.items[0]).to.have.property("items");
                    done();
                });
            });

            it("should return an object with an items property whose first item is the first top-level item", function (done) {
                hithercontent.getProjectBranch(111111, i => i, function (branch) {
                    expect(branch.items[0].data).to.have.property("id", 1);
                    done();
                });
            });

            it("should return an object with an items property whose first item has the config property", function (done) {
                hithercontent.getProjectBranch(111111, i => i, function (branch) {
                    expect(branch.items[0].data).to.have.property("config");
                    done();
                });
            });

            it("should return an object with the first item having the two child items as specified", function (done) {
                hithercontent.getProjectBranch(111111, i => i, function (branch) {
                    expect(branch.items[0].items).to.have.length(2);
                    done();
                });
            });

            it("should return an object with the first item's child having a data property", function (done) {
                hithercontent.getProjectBranch(111111, i => i, function (branch) {
                    expect(branch.items[0].items[0]).to.have.property("data");
                    done();
                });
            });

            it("should return an object with an items property whose first item's children all have tier properties", function (done) {
                hithercontent.getProjectBranch(111111, i => i, function (branch) {
                    expect(branch.items[0].items).to.satisfy(i => i.reduce((p, c) => p && c.hasOwnProperty("tier")), true);
                    done();
                });
            });

            it("should return an object with an items property whose first item's children all have a tier of 2", function (done) {
                hithercontent.getProjectBranch(111111, i => i, function (branch) {
                    expect(branch.items[0].items).to.satisfy(i => i.reduce((p, c) => p && c.tier === 2, !!i.length));
                    done();
                });
            });

            it("should return an object with the first item's first child item having an id of '11'", function (done) {
                hithercontent.getProjectBranch(111111, i => i, function (branch) {
                    expect(branch.items[0].items[0].data).to.have.property("id", 11);
                    done();
                });
            });


            it("should return an object with the first item's second child item having an id of '12'", function (done) {
                hithercontent.getProjectBranch(111111, i => i, function (branch) {
                    expect(branch.items[0].items[1].data).to.have.property("id", 12);
                    done();
                });
            });

            it("should return an object with the first item's second child having correct number of child items", function (done) {
                hithercontent.getProjectBranch(111111, i => i, function (branch) {
                    expect(branch.items[0].items[1].items).to.have.length(3);
                    done();
                });
            });

            it("should return an object with an items property whose first item's second item's children all have tier properties", function (done) {
                hithercontent.getProjectBranch(111111, i => i, function (branch) {
                    expect(branch.items[0].items[1].items).to.satisfy(i => i.reduce((p, c) => p && c.hasOwnProperty("tier")), true);
                    done();
                });
            });

            it("should return an object with an items property whose first item's second item's children all have a tier of 3", function (done) {
                hithercontent.getProjectBranch(111111, i => i, function (branch) {
                    expect(branch.items[0].items[1].items).to.satisfy(i => i.reduce((p, c) => p && c.tier === 3, !!i.length));
                    done();
                });
            });

            it("should return an object with ordering of items according to positioning", function (done) {
                hithercontent.getProjectBranch(111111, i => i, function (branch) {
                    expect(branch.items[0].items[1].items).to.eql([
                        { "id": 123, "position": "5", "tier": 3, "items": [], "data": { "id": 123, "position": "5", "config": [ { "label": "First tab", "elements": [ { "type": "text", "label": "Text element", "value": "Lorem ipsum" } ] } ] } },
                        { "id": 122, "position": "6", "tier": 3, "items": [], "data": { "id": 122, "position": "6", "config": [ { "label": "First tab", "elements": [ { "type": "text", "label": "Text element", "value": "Lorem ipsum" } ] } ] } },
                        { "id": 121, "position": "7", "tier": 3, "items": [], "data": { "id": 121, "position": "7", "config": [ { "label": "First tab", "elements": [ { "type": "text", "label": "Text element", "value": "Lorem ipsum" } ] } ] } }
                    ]);
                    done();
                });
            });

        });

        describe("but with the `reduceItemToKVPairs` function acting on each item", function () {
            it("should return an object", function (done) {
                hithercontent.getProjectBranch(111111, hithercontent.reduceItemToKVPairs, function (branch) {
                    expect(branch).to.be.an("object");
                    done();
                });
            });

            it("should return an object with an items property", function (done) {
                hithercontent.getProjectBranch(111111, hithercontent.reduceItemToKVPairs, function (branch) {
                    expect(branch).to.have.keys("items");
                    done();
                });
            });

            it("should return an object with an items property containing only the top-level items", function (done) {
                hithercontent.getProjectBranch(111111, hithercontent.reduceItemToKVPairs, function (branch) {
                    expect(branch.items).to.have.length(2);
                    done();
                });
            });

            it("should return an object with an items property whose children all have tier properties", function (done) {
                hithercontent.getProjectBranch(111111, hithercontent.reduceItemToKVPairs, function (branch) {
                    expect(branch.items).to.satisfy(i => i.reduce((p, c) => p && c.hasOwnProperty("tier")), true);
                    done();
                });
            });

            it("should return an object with an items property whose children all have a tier of 3", function (done) {
                hithercontent.getProjectBranch(111111, hithercontent.reduceItemToKVPairs, function (branch) {
                    expect(branch.items).to.satisfy(i => i.reduce((p, c) => p && c.tier === 1, !!i.length));
                    done();
                });
            });

            it("should return an object with the first item having the two child items as specified", function (done) {
                hithercontent.getProjectBranch(111111, hithercontent.reduceItemToKVPairs, function (branch) {
                    expect(branch.items[0].items).to.have.length(2);
                    done();
                });
            });

            it("should return an object with an items property whose first item's children all have tier properties", function (done) {
                hithercontent.getProjectBranch(111111, hithercontent.reduceItemToKVPairs, function (branch) {
                    expect(branch.items[0].items).to.satisfy(i => i.reduce((p, c) => p && c.hasOwnProperty("tier")), true);
                    done();
                });
            });

            it("should return an object with an items property whose first item's children all have a tier of 3", function (done) {
                hithercontent.getProjectBranch(111111, hithercontent.reduceItemToKVPairs, function (branch) {
                    expect(branch.items[0].items).to.satisfy(i => i.reduce((p, c) => p && c.tier === 2, !!i.length));
                    done();
                });
            });

            it("should return an object with the first item's first child item having an id of '11'", function (done) {
                hithercontent.getProjectBranch(111111, hithercontent.reduceItemToKVPairs, function (branch) {
                    expect(branch.items[0].items[0]).to.have.property("_id", 11);
                    done();
                });
            });


            it("should return an object with the first item's second child item having an id of '12'", function (done) {
                hithercontent.getProjectBranch(111111, hithercontent.reduceItemToKVPairs, function (branch) {
                    expect(branch.items[0].items[1]).to.have.property("_id", 12);
                    done();
                });
            });

            it("should return an object with the first item's second child having correct number of child items", function (done) {
                hithercontent.getProjectBranch(111111, hithercontent.reduceItemToKVPairs, function (branch) {
                    expect(branch.items[0].items[1].items).to.have.length(3);
                    done();
                });
            });

            it("should return an object with an items property whose first item's second item's children all have tier properties", function (done) {
                hithercontent.getProjectBranch(111111, hithercontent.reduceItemToKVPairs, function (branch) {
                    expect(branch.items[0].items[1].items).to.satisfy(i => i.reduce((p, c) => p && c.hasOwnProperty("tier")), true);
                    done();
                });
            });

            it("should return an object with an items property whose first item's second item's children all have a tier of 3", function (done) {
                hithercontent.getProjectBranch(111111, hithercontent.reduceItemToKVPairs, function (branch) {
                    expect(branch.items[0].items[1].items).to.satisfy(i => i.reduce((p, c) => p && c.tier === 3, !!i.length));
                    done();
                });
            });

            it("should return an object with ordering of items according to positioning", function (done) {
                hithercontent.getProjectBranch(111111, hithercontent.reduceItemToKVPairs, function (branch) {
                    expect(branch.items[0].items[1].items).to.eql([
                        { "id": 123, "position": "5", "tier": 3, "items": [], "_id": 123, "_position": "5", "First-tab_Text-element": "Lorem ipsum" },
                        { "id": 122, "position": "6", "tier": 3, "items": [], "_id": 122, "_position": "6", "First-tab_Text-element": "Lorem ipsum" },
                        { "id": 121, "position": "7", "tier": 3, "items": [], "_id": 121, "_position": "7", "First-tab_Text-element": "Lorem ipsum" }
                    ]);
                    done();
                });
            });
        });
    });

    describe("while specifiying an item id", function() {
        it("should return an object", function (done) {
            hithercontent.getProjectBranch(111111, 2, function (branch) {
                expect(branch).to.be.an("object");
                done();
            });
        });

        it("should return an object with an items property", function (done) {
            hithercontent.getProjectBranch(111111, 2, function (branch) {
                expect(branch).to.have.keys("items");
                done();
            });
        });

        it("should return an object with an items property has only one item", function (done) {
            hithercontent.getProjectBranch(111111, 2, function (branch) {
                expect(branch.items).to.have.length(1);
                done();
            });
        });

        it("should return an object with an items property whose first item shares the same id as that requested", function (done) {
            hithercontent.getProjectBranch(111111, 2, function (branch) {
                expect(branch.items[0]).to.have.property("id", 2);
                done();
            });
        });

        it("should return an object whose item has the correct first child item (e.g., 21)", function (done) {
            hithercontent.getProjectBranch(111111, 2, function (branch) {
                expect(branch.items[0].items[0]).to.have.property("id", 21);
                done();
            });
        });

        it("should return an object whose item has the correct second child item (e.g., 22)", function (done) {
            hithercontent.getProjectBranch(111111, 2, function (branch) {
                expect(branch.items[0].items[1]).to.have.property("id", 22);
                done();
            });
        });

        describe("but with an identity function acting on each item", function () {
            it("should return an object", function (done) {
                hithercontent.getProjectBranch(111111, 2, i => i, function (branch) {
                    expect(branch).to.be.an("object");
                    done();
                });
            });

            it("should return an object with an items property", function (done) {
                hithercontent.getProjectBranch(111111, 2, i => i, function (branch) {
                    expect(branch).to.have.keys("items");
                    done();
                });
            });

            it("should return an object with an items property has only one item", function (done) {
                hithercontent.getProjectBranch(111111, 2, i => i, function (branch) {
                    expect(branch.items).to.have.length(1);
                    done();
                });
            });

            it("should return an object with an items property whose first item contains a data property", function (done) {
                hithercontent.getProjectBranch(111111, 2, i => i, function (branch) {
                    expect(branch.items[0]).to.have.property("data");
                    done();
                });
            });

            it("should return an object with an items property whose first item contains an items property", function (done) {
                hithercontent.getProjectBranch(111111, 2, i => i, function (branch) {
                    expect(branch.items[0]).to.have.property("items");
                    done();
                });
            });

            it("should return an object with an items property whose first item shares the same id as that requested", function (done) {
                hithercontent.getProjectBranch(111111, 2, i => i, function (branch) {
                    expect(branch.items[0].data).to.have.property("id", 2);
                    done();
                });
            });

            it("should return an object with an items property whose first item shares the same id as that requested", function (done) {
                hithercontent.getProjectBranch(111111, 2, i => i, function (branch) {
                    expect(branch.items[0].data).to.have.property("config");
                    done();
                });
            });
        });

        describe("but with the `reduceItemToKVPairs` function acting on each item", function () {
            it("should return an object", function (done) {
                hithercontent.getProjectBranch(111111, 2, hithercontent.reduceItemToKVPairs, function (branch) {
                    expect(branch).to.be.an("object");
                    done();
                });
            });

            it("should return an object with an items property", function (done) {
                hithercontent.getProjectBranch(111111, 2, hithercontent.reduceItemToKVPairs, function (branch) {
                    expect(branch).to.have.keys("items");
                    done();
                });
            });

            it("should return an object with an items property has only one item", function (done) {
                hithercontent.getProjectBranch(111111, 2, hithercontent.reduceItemToKVPairs, function (branch) {
                    expect(branch.items).to.have.length(1);
                    done();
                });
            });

            it("should return an object with an items property whose first item shares the same id as that requested", function (done) {
                hithercontent.getProjectBranch(111111, 2, hithercontent.reduceItemToKVPairs, function (branch) {
                    expect(branch.items[0]).to.have.property("_id", 2);
                    done();
                });
            });
        });
    });

    describe("while specifiying an item that has no children", function() {
        it("should return an object", function (done) {
            hithercontent.getProjectBranch(111111, 221, function (branch) {
                expect(branch).to.be.an("object");
                done();
            });
        });

        it("should return an object with an items property", function (done) {
            hithercontent.getProjectBranch(111111, 221, function (branch) {
                expect(branch).to.have.keys("items");
                done();
            });
        });

        it("should return an object with just one item", function (done) {
            hithercontent.getProjectBranch(111111, 221, function (branch) {
                expect(branch.items).to.have.length(1);
                done();
            });
        });

        it("should return an object with an items property whose first item shares the same id as that requested", function (done) {
            hithercontent.getProjectBranch(111111, 221, function (branch) {
                expect(branch.items[0]).to.have.property("id", 221);
                done();
            });
        });

        it("should return an object with an items property whose first item has an empty items property of its own", function (done) {
            hithercontent.getProjectBranch(111111, 221, function (branch) {
                expect(branch.items[0].items).to.be.empty;
                done();
            });
        });

        describe("but with identity function acting on each item", function () {
            it("should return an object", function (done) {
                hithercontent.getProjectBranch(111111, 221, i => i, function (branch) {
                    expect(branch).to.be.an("object");
                    done();
                });
            });

            it("should return an object with an items property", function (done) {
                hithercontent.getProjectBranch(111111, 221, i => i, function (branch) {
                    expect(branch).to.have.keys("items");
                    done();
                });
            });

            it("should return an object with just one item", function (done) {
                hithercontent.getProjectBranch(111111, 221, i => i, function (branch) {
                    expect(branch.items).to.have.length(1);
                    done();
                });
            });

            it("should return an object with an items property whose first item shares the same id as that requested", function (done) {
                hithercontent.getProjectBranch(111111, 221, i => i, function (branch) {
                    expect(branch.items[0].data).to.have.property("id", 221);
                    done();
                });
            });

            it("should return an object with an items property whose first item has an empty items property", function (done) {
                hithercontent.getProjectBranch(111111, 221, i => i, function (branch) {
                    expect(branch.items[0].items).to.be.empty;
                    done();
                });
            });
        });

        describe("but with `reduceItemToKVPairs` function acting on each item", function () {
            it("should return an object", function (done) {
                hithercontent.getProjectBranch(111111, 221, hithercontent.reduceItemToKVPairs, function (branch) {
                    expect(branch).to.be.an("object");
                    done();
                });
            });

            it("should return an object with an items property", function (done) {
                hithercontent.getProjectBranch(111111, 221, hithercontent.reduceItemToKVPairs, function (branch) {
                    expect(branch).to.have.keys("items");
                    done();
                });
            });

            it("should return an object with just one item", function (done) {
                hithercontent.getProjectBranch(111111, 221, hithercontent.reduceItemToKVPairs, function (branch) {
                    expect(branch.items).to.have.length(1);
                    done();
                });
            });

            it("should return an object with an items property whose first item shares the same id as that requested", function (done) {
                hithercontent.getProjectBranch(111111, 221, hithercontent.reduceItemToKVPairs, function (branch) {
                    expect(branch.items[0]).to.have.property("_id", 221);
                    done();
                });
            });

            it("should return an object with an items property whose first item has an empty items property of its own", function (done) {
                hithercontent.getProjectBranch(111111, 221, hithercontent.reduceItemToKVPairs, function (branch) {
                    expect(branch.items[0].items).to.be.empty;
                    done();
                });
            });
        });
    });
});
