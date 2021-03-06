#!/usr/bin/env python3
# @generated AUTOGENERATED file. Do not Change!

from dataclasses import dataclass
from datetime import datetime
from gql.gql.datetime_utils import DATETIME_FIELD
from gql.gql.graphql_client import GraphqlClient
from functools import partial
from numbers import Number
from typing import Any, Callable, List, Mapping, Optional

from dataclasses_json import DataClassJsonMixin

from .add_location_input import AddLocationInput


@dataclass
class AddLocationMutation(DataClassJsonMixin):
    __QUERY__: str = """
    mutation AddLocationMutation($input: AddLocationInput!) {
  addLocation(input: $input) {
    id
    name
    latitude
    longitude
    externalId
    locationType {
      name
    }
  }
}

    """

    @dataclass
    class AddLocationMutationData(DataClassJsonMixin):
        @dataclass
        class Location(DataClassJsonMixin):
            @dataclass
            class LocationType(DataClassJsonMixin):
                name: str

            id: str
            name: str
            latitude: Number
            longitude: Number
            locationType: LocationType
            externalId: Optional[str] = None

        addLocation: Optional[Location] = None

    data: Optional[AddLocationMutationData] = None

    @classmethod
    # fmt: off
    def execute(cls, client: GraphqlClient, input: AddLocationInput):
        # fmt: off
        variables = {"input": input}
        response_text = client.call(cls.__QUERY__, variables=variables)
        return cls.from_json(response_text).data
