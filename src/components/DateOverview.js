import React, { useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { Button, message, DatePicker } from 'antd';
import styled from 'styled-components';
import RawDataSummary from './RawDataSummary';
import LeafletBox from '../leaflet/LeafletBox';

const OverviewDatePicker = styled(DatePicker)`
	width: 80%;
	margin-bottom: 10px;
`;

const GoButton = styled(Button)`
	width: 20%;
`;

const Container = styled.div`
	padding-top: 40px;
`;

const DateOverview = (props) => {
	const [selectedDate, setSelectedDate] = useState();
	const [selectedVehicleDateData, setSelectedVehicleDateData] = useState({});

	const findShortestDistance = async (waypoints, googleApiKey) => {
		if (!googleApiKey) { return; }

		const [origins, destinations] = [[], []];
		for (const [origin, destination] of waypoints) {
			origins.push(origin.join(','));
			destinations.push(destination.join(','));
		}

		const { data } = await axios(`https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${origins.join('|')}&destinations=${destinations.join('|')}&key=${googleApiKey}`);

		const shortestDistanceInMeters = data.rows.reduce((acc, currentValue) => {
			return acc + currentValue.elements.reduce((tripSum, trip) => {
				return tripSum + trip.distance.value;
			}, 0);
		}, 0);

		return parseInt(shortestDistanceInMeters / 1000);
	};

	const queryRawData = async (apiKey, googleApiKey, day, vehicle) => {
		const formattedDay = day.format('YYYY-MM-DD');
		const formattedNextDay = day.clone().add(1, 'days').format('YYYY-MM-DD');

		message.loading({ content: `Rendering route for ${formattedDay}`, key: 'rendering' });

		let data;
		try {
			({ data } = await axios(`https://app.ecofleet.com/seeme/Api/Vehicles/getRawData?objectId=${vehicle.objectId}&begTimestamp=${formattedDay}&endTimestamp=${formattedNextDay}&key=${apiKey}&json`));
		} catch (err) {
			console.error(err);
			return message.error({ content: 'Failed to fetch route', key: 'rendering' });
		}

		const positions = [];
		const waypoints = []; // waypoints holds pairs of coordinates where engine was turned on and off
		let currentWayPoint = [];
		let driving = false;
		for (const rawDataPoint of data.response) {
			if (rawDataPoint.EngineStatus && !driving) {
				currentWayPoint[0] = [rawDataPoint.Latitude, rawDataPoint.Longitude];
				driving = true;
			} else if (!rawDataPoint.EngineStatus && driving) {
				currentWayPoint[1] = [rawDataPoint.Latitude, rawDataPoint.Longitude];
				driving = false;
				waypoints.push(currentWayPoint);
				currentWayPoint = [];
			}

			if (rawDataPoint.EngineStatus) {
				positions.push(
					[rawDataPoint.Latitude, rawDataPoint.Longitude]
				);
			}
		}

		LeafletBox.addVehicleRouteLine(positions);

		const formattedData = {
			positions,
			waypoints
		};

		if (data.response.length >= 2) {
			formattedData.distance = parseInt(data.response.slice(-1)[0].Distance - data.response[0].Distance, 10);
			formattedData.shortestDistance = await findShortestDistance(waypoints, googleApiKey);
		}

		setSelectedVehicleDateData(formattedData);

		message.success({ content: 'Added route to the map', key: 'rendering' });
	};

	return (
		<Container>
			<OverviewDatePicker disabled={!props.vehicle} onChange={setSelectedDate} />
			<GoButton type="primary"
				disabled={!selectedDate || !props.apiKey}
				onClick={async () => { await queryRawData(props.apiKey, props.googleApiKey, selectedDate, props.vehicle); }}
			>Show route</GoButton>
			<RawDataSummary
				distance={selectedVehicleDateData.distance}
				shortestDistance={selectedVehicleDateData.shortestDistance}
				numberOfStops={selectedVehicleDateData.waypoints ? selectedVehicleDateData.waypoints.length : undefined}
			/>
		</Container>
	);
};

DateOverview.propTypes = {
	vehicle: PropTypes.object,
	apiKey: PropTypes.string,
	googleApiKey: PropTypes.string,
};

export default DateOverview;