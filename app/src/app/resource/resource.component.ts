import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
    ApiServiceError, ImageRegion,
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
                protected _resourceService: ResourceService
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

                this.collectImagesAndRegionsForResource(this.resource.resources[0]);


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

    openLink(prop: any) {
        console.log(prop);
//        this._router.navigate(['/resource/' + encodeURIComponent(prop.referredResource.id)]);
    }
}
