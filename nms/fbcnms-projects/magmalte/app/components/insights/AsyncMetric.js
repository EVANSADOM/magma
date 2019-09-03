/**
 * Copyright 2004-present Facebook. All Rights Reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */

import CircularProgress from '@material-ui/core/CircularProgress';
import React from 'react';
import axios from 'axios';
import moment from 'moment';
import {Line} from 'react-chartjs-2';

import {MagmaAPIUrls} from '../../common/MagmaAPI';
import {makeStyles} from '@material-ui/styles';
import {useEffect, useMemo, useState} from 'react';
import {useEnqueueSnackbar} from '@fbcnms/ui/hooks/useSnackbar';
import {useRouter} from '@fbcnms/ui/hooks';

type Props = {
  label: string,
  unit: string,
  queries: Array<string>,
  legendLabels?: Array<string>,
  timeRange: TimeRange,
  networkId?: string,
  usePrometheusDB: boolean,
};

const useStyles = makeStyles({
  loadingContainer: {
    paddingTop: 100,
    textAlign: 'center',
  },
});

export type TimeRange =
  | '3_hours'
  | '6_hours'
  | '12_hours'
  | '24_hours'
  | '7_days'
  | '14_days'
  | '30_days';

type RangeValue = {
  days?: number,
  hours?: number,
  step: string,
  unit: string,
};

const RANGE_VALUES: {[TimeRange]: RangeValue} = {
  '3_hours': {
    hours: 3,
    step: '30s',
    unit: 'minute',
  },
  '6_hours': {
    hours: 6,
    step: '1m',
    unit: 'hour',
  },
  '12_hours': {
    hours: 12,
    step: '5m',
    unit: 'hour',
  },
  '24_hours': {
    days: 1,
    step: '15m',
    unit: 'hour',
  },
  '7_days': {
    days: 7,
    step: '2h',
    unit: 'day',
  },
  '14_days': {
    days: 14,
    step: '4h',
    unit: 'day',
  },
  '30_days': {
    days: 14,
    step: '8h',
    unit: 'day',
  },
};

const COLORS = ['blue', 'red', 'green', 'yellow', 'purple', 'black'];

interface DatabaseHelper<T> {
  getLegendLabel(data: T): string;
  queryFunction: (networkID: string) => string;
  datapointFieldName: string;
}

class PrometheusHelper implements DatabaseHelper<PrometheusResponse> {
  getLegendLabel(result: PrometheusResponse): string {
    const {metric} = result;

    const tags = [];
    const droppedTags = ['gatewayID', 'networkID', 'service', '__name__'];
    for (const key in metric) {
      if (metric.hasOwnProperty(key) && !droppedTags.includes(key)) {
        tags.push(key + '=' + metric[key]);
      }
    }
    return tags.length === 0
      ? metric['__name__']
      : `${metric['__name__']} (${tags.join(', ')})`;
  }

  queryFunction = MagmaAPIUrls.prometheusQueryRange;
  datapointFieldName = 'values';
}

class GraphiteHelper implements DatabaseHelper<GraphiteResponse> {
  getLegendLabel(result: GraphiteResponse): string {
    const {target} = result;
    const label = JSON.stringify(target)
      .slice(1, -1) // remove double quotes
      .split(';'); // token separator for graphite
    const metric = label.shift();

    // remove gateway, network, and service tags, they're not interesting
    const tags = label.filter(tag => {
      const tagName = tag.split('=')[0];
      return (
        tagName !== 'gatewayID' &&
        tagName !== 'networkID' &&
        tagName !== 'service'
      );
    });
    return tags.length === 0 ? metric : `${metric} (${tags.join(', ')})`;
  }

  queryFunction = MagmaAPIUrls.graphiteQuery;
  datapointFieldName = 'datapoints';
}

type PrometheusResponse = {
  metric: {[key: string]: string},
};

type GraphiteResponse = {
  target: JSON,
};

function Progress() {
  const classes = useStyles();
  return (
    <div className={classes.loadingContainer}>
      <CircularProgress />
    </div>
  );
}

function getStartEnd(timeRange: TimeRange) {
  const {days, hours, step} = RANGE_VALUES[timeRange];
  const end = moment();
  const start = end.clone().subtract({days, hours});
  return {start: start.toISOString(), end: end.toISOString(), step};
}

function getUnit(timeRange: TimeRange) {
  return RANGE_VALUES[timeRange].unit;
}

function getColorForIndex(index: number) {
  return COLORS[index % COLORS.length];
}

function useDatasetsFetcher(props: Props) {
  const {match} = useRouter();
  const startEnd = useMemo(() => getStartEnd(props.timeRange), [
    props.timeRange,
  ]);
  const [allDatasets, setAllDatasets] = useState<?Array<{[string]: mixed}>>(
    null,
  );
  const enqueueSnackbar = useEnqueueSnackbar();
  const stringedQueries = JSON.stringify(props.queries);

  const dbHelper = useMemo(
    () =>
      props.usePrometheusDB ? new PrometheusHelper() : new GraphiteHelper(),
    [props.usePrometheusDB],
  );

  useEffect(() => {
    const queries = JSON.parse(stringedQueries);
    const requests = queries.map(async (query, index) => {
      try {
        const response = await axios.get(
          dbHelper.queryFunction(props.networkId || match),
          {
            params: {
              query,
              ...startEnd,
            },
          },
        );

        const label = props.legendLabels ? props.legendLabels[index] : null;
        return {response, label};
      } catch (error) {
        enqueueSnackbar('Error getting metric ' + props.label, {
          variant: 'error',
        });
      }
      return null;
    });

    Promise.all(requests).then(allResponses => {
      let index = 0;
      const datasets = [];
      allResponses.filter(Boolean).forEach(({response, label}) => {
        const result = props.usePrometheusDB
          ? response.data?.data?.result
          : response.data?.result;
        if (result) {
          result.map(it =>
            datasets.push({
              label: label || dbHelper.getLegendLabel(it),
              unit: props.unit || '',
              fill: false,
              lineTension: 0,
              pointRadius: 0,
              borderWidth: 2,
              backgroundColor: getColorForIndex(index),
              borderColor: getColorForIndex(index++),
              data: it[dbHelper.datapointFieldName].map(i => ({
                t: parseInt(i[0]) * 1000,
                y: parseFloat(i[1]),
              })),
            }),
          );
        }
      });
      setAllDatasets(datasets);
    });
  }, [
    stringedQueries,
    match,
    props.networkId,
    props.unit,
    startEnd,
    props.label,
    props.legendLabels,
    enqueueSnackbar,
    dbHelper,
    props.usePrometheusDB,
  ]);

  return allDatasets;
}

export default function AsyncMetric(props: Props) {
  const allDatasets = useDatasetsFetcher(props);
  if (allDatasets === null) {
    return <Progress />;
  }

  if (allDatasets?.length === 0) {
    return 'No Data';
  }

  return (
    <Line
      options={{
        maintainAspectRatio: false,
        scaleShowValues: true,
        scales: {
          xAxes: [
            {
              type: 'time',
              time: {
                unit: getUnit(props.timeRange),
                round: 'second',
                tooltipFormat: ' YYYY/MM/DD h:mm:ss a',
              },
              scaleLabel: {
                display: true,
                labelString: 'Date',
              },
            },
          ],
          yAxes: [
            {
              position: 'left',
              scaleLabel: {
                display: true,
                labelString: props.unit,
              },
            },
          ],
        },
        tooltips: {
          enabled: true,
          mode: 'nearest',
          callbacks: {
            label: (tooltipItem, data) =>
              tooltipItem.yLabel + data.datasets[tooltipItem.datasetIndex].unit,
          },
        },
      }}
      legend={{
        position: 'bottom',
        labels: {
          boxWidth: 12,
        },
      }}
      data={{datasets: allDatasets}}
    />
  );
}