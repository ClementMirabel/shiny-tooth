angular.module('dcbia-projects')
.directive('projects', function($routeParams, dcbia, clusterauth) {

	function link($scope, $attrs, $filter){

		clusterauth.getUser()
		.then(function(res){
			$scope.user = res;
		})

		$scope.projects = {
			newProject: {
				collections: [],
				type: "project",
				name: "",
				scope: "",
				description: ""
			},
			projects: [],
			projectsProperties: {
				"defaultProject": {
					class: ''
				}
			},
			section: 0,
			showSection: 0
		};

		$scope.defaultProject = {
			_id: "defaultProject",
			name: "All projects",
			type: "project",
			items: 0
		};

		$scope.morphologicalDataCollection = {
			collections: [],
			selectedCollections: []
		};
		$scope.morphologicalCheckBox = false;

		$scope.clinicalDataCollection = {
			collections: [],
			selectedCollections: []
		};

		$scope.clinicalCheckBox = false;

		$scope.csv = {};

		$scope.$watch('csv.file', function(){
			if($scope.csv.file){
				$scope.csv.readFile()
				.then(function(){
					$scope.$apply();
				});
			}
		});

		$scope.projects.getProjects = function(){
			return dcbia.getProjects()
			.then(function(res){
				delete $scope.projects.selectedProject;
				$scope.projects.projects = res.data;
				_.each($scope.projects.projects, function(project){
					$scope.projects.projectsProperties[project._id] = {
						class : ""
					};
				});
			})
			.catch(console.error);
		};

		$scope.projects.create = function(newProject){
			_.each($scope.clinicalDataCollection.selectedCollections, function(collection){
				_.each($scope.clinicalDataCollection.collections, function(items){
					if(collection === items.name){
						$scope.projects.newProject.collections.push({"_id": items._id})
					}
				});
			});
			_.each($scope.morphologicalDataCollection.selectedCollections, function(collection){
				_.each($scope.morphologicalDataCollection.collections, function(items){
					if(collection === items.name){
						$scope.projects.newProject.collections.push({"_id": items._id})
					}
				});
			});
			if($scope.projects.newProject.scope === ""){
				delete $scope.projects.newProject.scope;
			}
			dcbia.createProject(newProject)
			.then(function(res){
				return $scope.projects.getProjects();
			})
			.catch(console.error);
		};

		$scope.projects.update = function(project){
			project.collections = [];
			_.each($scope.clinicalDataCollection.selectedCollections, function(collection){
				_.each($scope.clinicalDataCollection.collections, function(items){
					if(collection === items.name){
						project.collections.push({"_id": items._id})
					}
				});
			});
			_.each($scope.morphologicalDataCollection.selectedCollections, function(collection){
				_.each($scope.morphologicalDataCollection.collections, function(items){
					if(collection === items.name){
						project.collections.push({"_id": items._id})
					}
				});
			});
			if(project.scope === ""){
				delete project.scope;
			}

			dcbia.updateProject(project)
			.then(function(res){
				return $scope.projects.getProjects();
			})
			.catch(console.error);
		};

		$scope.projects.delete = function(project){
			if (confirm("Are you sure you want to delete the project?")) {
			    dcbia.deleteProject(project._id)
				.then(function(res){
					return $scope.projects.getProjects();
				})
				.catch(console.error);
			} 
		};

		$scope.projects.selectProject = function(project){
			if($scope.projects.selectedProject){
				$scope.projects.projectsProperties[$scope.projects.selectedProject._id].class = "";
			}
			$scope.projects.selectedProject = project;
			$scope.projects.projectsProperties[project._id].class = "alert alert-info";
			$scope.clinicalDataCollection.selectedCollections = [];
			$scope.morphologicalDataCollection.selectedCollections = [];
			_.each($scope.projects.selectedProject.collections,function(collection){
				_.each($scope.clinicalDataCollection.collections,function(clinicalCollection){
					if(collection._id == clinicalCollection._id){
						$scope.clinicalDataCollection.selectedCollections.push(clinicalCollection.name);
					}
				})
				_.each($scope.morphologicalDataCollection.collections,function(morphologicalDataCollection){
					if(collection._id == morphologicalDataCollection._id){
						$scope.morphologicalDataCollection.selectedCollections.push(morphologicalDataCollection.name);
					}
				})
			})
		};

		$scope.projects.getProjectKeys = function(project){
			var projectKeys = {};
			_.each(project, function(items){
				_.extend(projectKeys, items);
			});
			if(projectKeys._id){
				delete projectKeys._id;
			}

			if(projectKeys._rev){
				delete projectKeys._rev;
			}
			return _.keys(projectKeys);
		}

		$scope.projects.select = function(project){
			return dcbia.getProject(project._id)
			.then(function(res){
				var selectedProject = res.data;
				$scope.projects.selectProject(selectedProject);
				$scope.projects.selectedProjectKeys = $scope.projects.getProjectKeys([selectedProject]);
			})
			.catch(console.error);
		};

		$scope.projects.clearForm = function(force){
			if(!force){
				force = confirm("Do you want to clear the current changes?");
			}
			if(force){
				$scope.projects.newProject = {
					collections: [],
					type: "project",
					name: "",
					scope: "",
					description: ""
				};
				$scope.morphologicalDataCollection.selectedCollections = [];
				$scope.clinicalDataCollection.selectedCollections = [];
			}
		};

		$scope.projects.getProjectItems = function(project){
			var sum = 0;
			_.each(project.collections,function(collection){
				_.each($scope.clinicalDataCollection.collections,function(clinicalCollection){
					if(collection._id == clinicalCollection._id){
						sum += clinicalCollection.items.length;
					}
				})
				_.each($scope.morphologicalDataCollection.collections,function(morphologicalDataCollection){
					if(collection._id == morphologicalDataCollection._id){
						sum += morphologicalDataCollection.items.length;
					}
				})
			})
			return sum;
		};

		$scope.morphologicalDataCollection.getMorphologicalDataCollections = function(){
			return dcbia.getMorphologicalDataCollections()
			.then(function(res){
				$scope.morphologicalDataCollection.collections = res.data;
			})
			.catch(console.error);
		};

		$scope.morphologicalDataCollection.checkAll = function(checkbox) {
			$scope.morphologicalDataCollection.selectedCollections = [];
			if(checkbox){
				_.each($scope.morphologicalDataCollection.collections,function(collection){
					$scope.morphologicalDataCollection.selectedCollections.push(collection.name);
            	});
			}
  		};

    	$scope.morphologicalDataCollection.isCollectionInProject = function(collection){
  			var display = false;
  			_.each($scope.morphologicalDataCollection.selectedCollections,function(selectedCollection){
  				if(collection.name === selectedCollection){
  					display = true;
  				}
            });
            return display;
  		}

		$scope.clinicalDataCollection.getClinicalDataCollections = function(){
			return dcbia.getClinicalDataCollections()
			.then(function(res){
				$scope.clinicalDataCollection.collections = res.data;
			})
			.catch(console.error);
		};

		$scope.clinicalDataCollection.checkAll = function(checkbox) {
			$scope.clinicalDataCollection.selectedCollections = [];
			if(checkbox){
				_.each($scope.clinicalDataCollection.collections,function(collection){
					$scope.clinicalDataCollection.selectedCollections.push(collection.name);
            	});
			}
  		};

  		$scope.clinicalDataCollection.isCollectionInProject = function(collection){
  			var display = false;
  			_.each($scope.clinicalDataCollection.selectedCollections,function(selectedCollection){
  				if(collection.name === selectedCollection){
  					display = true;
  				}
            });
            return display;
  		}

		$scope.csv.export = function(project){
			var prom;
			if(!$scope.projects.selectedProject || project._id !== $scope.projects.selectedProject._id){
				prom = $scope.projects.select(project);
			}else{
				prom = Promise.resolve(true);
			}

			prom
			.then(function(){
				var keys = $scope.projects.getProjectKeys([$scope.projects.selectedProject]);
				var csv = 'name:,' + $scope.projects.selectedProject.name + '\n'
				csv += 'description:,' + $scope.projects.selectedProject.description + '\n'
				if(keys.indexOf("scope") !== -1){
					csv += 'scope:,' + $scope.projects.selectedProject.scope + '\n'
				}
				csv += '\n';
				var collectionKeys = ['Name','Number of items','Type']
				csv += collectionKeys.toString();
				csv += '\n';
				_.each($scope.projects.selectedProject.collections, function(collection, i){
					_.each($scope.clinicalDataCollection.collections, function(clinicalCollection){
						if(collection._id === clinicalCollection._id){
							csv += clinicalCollection.name + ',' + clinicalCollection.items.length + ',' + clinicalCollection.type + '\n';
						}
					})
					_.each($scope.morphologicalDataCollection.collections, function(morphologicalDataCollection){
						if(collection._id === morphologicalDataCollection._id){
							csv += morphologicalDataCollection.name + ',' + morphologicalDataCollection.items.length + ',' + morphologicalDataCollection.type + '\n';
						}
					})
				})

				var filename = $scope.projects.selectedProject.name;
				if($scope.projects.selectedProject.name.indexOf('csv') === -1){
					filename += '.csv';
				}

				return $scope.csv.download(filename, csv);
			});
			
		}

		$scope.csv.download = function(filename, csv){

			var pom = document.createElement('a');
			var bb = new Blob([csv], {type: 'text/plain'});

			pom.setAttribute('href', window.URL.createObjectURL(bb));
			pom.setAttribute('download', filename);

			pom.dataset.downloadurl = ['text/plain', pom.download, pom.href].join(':');
			pom.click();
			
		}
		
		$scope.projects.getProjects();
		$scope.morphologicalDataCollection.getMorphologicalDataCollections();
		$scope.clinicalDataCollection.getClinicalDataCollections();

	}

	return {
		restrict : 'E',
	    link : link,
	    templateUrl: './src/dcbia-projects.template.html'
	}	

});