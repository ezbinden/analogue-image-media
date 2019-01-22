import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
    ApiServiceError, ImageRegion, IncomingService,
    KnoraConstants,
    OntologyInformation, ReadResource,
    ReadResourcesSequence, ReadStillImageFileValue,
    ResourceService, StillImageRepresentation
} from '@knora/core';

@Component({
    selector: 'app-resource',
    templateUrl: './resource.component.html',
    styleUrls: ['./resource.component.scss']
})
export class ResourceComponent implements OnInit {

    iri: string;

    resource: ReadResourcesSequence;
    ontologyInfo: OntologyInformation;
    loading = true;
    error: any;
    KnoraConstants = KnoraConstants;


    constructor(protected _route: ActivatedRoute,
                protected _router: Router,
                protected _resourceService: ResourceService,
                protected _incomingService: IncomingService
    ) {
        this._route.params.subscribe((params: Params) => {
            this.iri = params['iri'];
        });
    }

    ngOnInit() {
        this.loading = true;
        this._resourceService.getReadResource(decodeURIComponent(this.iri)).subscribe(
            (result: ReadResourcesSequence) => {
                console.log(result);
                this.resource = result;

                // collect images and regions
                this.collectImagesAndRegionsForResource(this.resource.resources[0]);

                // get incoming resources
                this.requestIncomingResources();


                // wait until the resource is ready
                setTimeout(() => {
                    // console.log(this.resource);
                    this.loading = false;
                }, 3000);
            },
            (error: ApiServiceError) => {
                console.error(error);
            }
        )
    }


    collectImagesAndRegionsForResource(resource: ReadResource): void {

        const imgRepresentations: StillImageRepresentation[] = [];

        if (resource.properties[KnoraConstants.hasStillImageFileValue] !== undefined) {
            // TODO: check if resources is a StillImageRepresentation using the ontology responder (support for subclass relations required)
            // resource has StillImageFileValues that are directly attached to it (properties)

            const fileValues: ReadStillImageFileValue[] = resource.properties[KnoraConstants.hasStillImageFileValue] as ReadStillImageFileValue[];
            const imagesToDisplay: ReadStillImageFileValue[] = fileValues.filter((image) => {
                return !image.isPreview;
            });


            for (const img of imagesToDisplay) {

                const regions: ImageRegion[] = [];
                for (const incomingRegion of resource.incomingRegions) {

                    const region = new ImageRegion(incomingRegion);

                    regions.push(region);

                }

                const stillImage = new StillImageRepresentation(img, regions);
                imgRepresentations.push(stillImage);

            }


        } else if (resource.incomingStillImageRepresentations.length > 0) {
            // there are StillImageRepresentations pointing to this resource (incoming)

            const readStillImageFileValues: ReadStillImageFileValue[] = resource.incomingStillImageRepresentations.map(
                (stillImageRes: ReadResource) => {
                    const fileValues = stillImageRes.properties[KnoraConstants.hasStillImageFileValue] as ReadStillImageFileValue[];
                    // TODO: check if resources is a StillImageRepresentation using the ontology responder (support for subclass relations required)
                    const imagesToDisplay = fileValues.filter((image) => {
                        return !image.isPreview;
                    });

                    return imagesToDisplay;
                }
            ).reduce(function (prev, curr) {
                // transform ReadStillImageFileValue[][] to ReadStillImageFileValue[]
                return prev.concat(curr);
            });

            for (const img of readStillImageFileValues) {

                const regions: ImageRegion[] = [];
                for (const incomingRegion of resource.incomingRegions) {

                    const region = new ImageRegion(incomingRegion);
                    regions.push(region);

                }

                const stillImage = new StillImageRepresentation(img, regions);
                imgRepresentations.push(stillImage);
            }

        }

        resource.stillImageRepresentationsToDisplay = imgRepresentations;

    }

    requestIncomingResources(): void {

        // make sure that this.resource has been initialized correctly
        if (this.resource === undefined) {
            return;
        }

        // request incoming regions
        if (this.resource.resources[0].properties[KnoraConstants.hasStillImageFileValue]) {
            // TODO: check if resources is a StillImageRepresentation using the ontology responder (support for subclass relations required)
            // the resource is a StillImageRepresentation, check if there are regions pointing to it

            this.getIncomingRegions(0);

        } else {
            // this resource is not a StillImageRepresentation
            // check if there are StillImageRepresentations pointing to this resource

            // this gets the first page of incoming StillImageRepresentations
            // more pages may be requested by [[this.viewer]].
            // TODO: for now, we begin with offset 0. This may have to be changed later (beginning somewhere in a collection)
            // this.getIncomingStillImageRepresentations(0);
        }

        // check for incoming links for the current resource
        this.getIncomingLinks(0);


    }

    getIncomingRegions(offset: number, callback?: (numberOfResources: number) => void): void {
        this._incomingService.getIncomingRegions(this.resource.resources[0].id, offset).subscribe(
            (regions: ReadResourcesSequence) => {
                // update ontology information
                this.ontologyInfo.updateOntologyInformation(regions.ontologyInformation);

                // Append elements of regions.resources to resource.incoming
                Array.prototype.push.apply(this.resource.resources[0].incomingRegions, regions.resources);

                // prepare regions to be displayed
                this.collectImagesAndRegionsForResource(this.resource.resources[0]);

                // TODO: implement osdViewer
                /* if (this.osdViewer) {
                  this.osdViewer.updateRegions();
                } */

                // if callback is given, execute function with the amount of new images as the parameter
                if (callback !== undefined) {
                    callback(regions.resources.length);
                }
            },
            (error: any) => {
                console.error(error);
                this.loading = false;
            }
        );
    }

    getIncomingLinks(offset: number, callback?: (numberOfResources: number) => void): void {

        this._incomingService.getIncomingLinksForResource(this.resource.resources[0].id, offset).subscribe(
            (incomingResources: ReadResourcesSequence) => {
                // update ontology information
                this.ontologyInfo.updateOntologyInformation(incomingResources.ontologyInformation);

                // Append elements incomingResources to this.resource.incomingLinks
                Array.prototype.push.apply(this.resource.resources[0].incomingLinks, incomingResources.resources);

                // if callback is given, execute function with the amount of incoming resources as the parameter
                if (callback !== undefined) {
                    callback(incomingResources.resources.length);
                }
            },
            (error: any) => {
                console.error(error);
                this.loading = false;
            }
        );
    }

    openLink(prop: any) {
        console.log(prop);
//        this._router.navigate(['/resource/' + encodeURIComponent(prop.referredResource.id)]);
    }
}
