import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import {
    ApiServiceError,
    KnoraConstants,
    OntologyInformation,
    ReadResourcesSequence,
    ResourceService
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

    openLink(prop: any) {
        console.log(prop);
//        this._router.navigate(['/resource/' + encodeURIComponent(prop.referredResource.id)]);
    }
}
