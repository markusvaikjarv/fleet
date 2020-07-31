import React from 'react';
import PropTypes from 'prop-types';
import { Descriptions } from 'antd';

const RawDataSummary = (props) => {
	const distanceText = props.distance ?
		`${parseInt(props.distance, 10)} km` : '-';
	const numberOfStopsText = props.numberOfStops || '-';

	return (
		<Descriptions bordered>
			<Descriptions.Item span={3} label="Total distance">{distanceText}</Descriptions.Item>
			<Descriptions.Item span={3} label="Number of stops">{numberOfStopsText}</Descriptions.Item>
		</Descriptions>
	);
};

RawDataSummary.propTypes = {
	distance: PropTypes.number,
	numberOfStops: PropTypes.number,
};

export default RawDataSummary;